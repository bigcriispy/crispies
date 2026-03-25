import numpy as np
import matplotlib.pyplot as plt

# Set random seed for reproducibility
np.random.seed(42)

# ============================================================================
# SIMPLE MCMC EXAMPLE: Estimating coin bias from coin flips
# ============================================================================

# Data: We flipped a coin 100 times and got 63 heads
n_flips = 100
n_heads = 63

# ============================================================================
# Step 1: Define the likelihood (how likely is the data under a given parameter?)
# ============================================================================

def likelihood(p, n_heads, n_flips):
    """
    Probability of observing n_heads given a coin bias p.
    Uses binomial likelihood: p^heads * (1-p)^tails
    """
    return (p ** n_heads) * ((1 - p) ** (n_flips - n_heads))


# ============================================================================
# Step 2: Define the prior (what we believe about p before seeing data)
# ============================================================================

def prior(p):
    """
    Prior belief: uniform distribution from 0 to 1
    (we think any value of p is equally likely before seeing data)
    """
    if 0 <= p <= 1:
        return 1.0
    return 0.0


# ============================================================================
# Step 3: Implement MCMC (Metropolis-Hastings algorithm)
# ============================================================================

def mcmc_coin_flip(n_iterations=10000, proposal_width=0.05):
    """
    Run MCMC to sample from the posterior distribution of coin bias p.
    
    Args:
        n_iterations: How many samples to draw
        proposal_width: How far to step away from current value (smaller = more conservative)
    
    Returns:
        chain: Array of sampled p values (the posterior samples)
    """
    
    # Initialize chain with random starting value
    chain = []
    current_p = 0.5  # Start at 0.5 (fair coin assumption)
    
    for i in range(n_iterations):
        # Step 1: Propose a new parameter value
        # We propose something close to current value (random walk)
        proposed_p = current_p + np.random.normal(0, proposal_width)
        
        # Keep it between 0 and 1
        proposed_p = np.clip(proposed_p, 0, 1)
        
        # Step 2: Calculate acceptance ratio
        # How much better is the proposed value than the current value?
        current_posterior = likelihood(current_p, n_heads, n_flips) * prior(current_p)
        proposed_posterior = likelihood(proposed_p, n_heads, n_flips) * prior(proposed_p)
        
        # Acceptance ratio (avoid division by zero)
        if current_posterior > 0:
            acceptance_ratio = proposed_posterior / current_posterior
        else:
            acceptance_ratio = 1.0
        
        # Step 3: Accept or reject the proposal
        if np.random.uniform(0, 1) < acceptance_ratio:
            # Accept the proposal
            current_p = proposed_p
            accepted = True
        else:
            # Reject - stay at current value
            accepted = False
        
        # Step 4: Store the current value in the chain
        chain.append(current_p)
        
        # Print progress
        if (i + 1) % 2000 == 0:
            print(f"Iteration {i + 1}/{n_iterations}")
    
    return np.array(chain)


# ============================================================================
# Run MCMC
# ============================================================================

print("Running MCMC...")
chain = mcmc_coin_flip(n_iterations=10000, proposal_width=0.05)
print("Done!\n")

# ============================================================================
# Step 4: Analyze the samples (discard burn-in)
# ============================================================================

# "Burn-in": Discard the first samples because they might not represent
# the true posterior yet (they're influenced by where we started)
burn_in = 1000
chain_after_burnin = chain[burn_in:]

print(f"Posterior Statistics:")
print(f"  Mean: {np.mean(chain_after_burnin):.4f}")
print(f"  Median: {np.median(chain_after_burnin):.4f}")
print(f"  Std Dev: {np.std(chain_after_burnin):.4f}")
print(f"  95% Credible Interval: [{np.percentile(chain_after_burnin, 2.5):.4f}, {np.percentile(chain_after_burnin, 97.5):.4f}]")
print(f"\nActual observed proportion: {n_heads / n_flips:.4f}")

# ============================================================================
# Step 5: Visualize the results
# ============================================================================

fig, axes = plt.subplots(1, 2, figsize=(14, 5))

# Plot 1: Trace plot (shows the chain over time)
ax1 = axes[0]
ax1.plot(chain, alpha=0.7, linewidth=0.5)
ax1.axvline(burn_in, color='red', linestyle='--', label='Burn-in cutoff')
ax1.set_xlabel('Iteration')
ax1.set_ylabel('Parameter value (p)')
ax1.set_title('Trace Plot: Parameter values over iterations')
ax1.legend()
ax1.grid(True, alpha=0.3)

# Plot 2: Histogram of posterior samples
ax2 = axes[1]
ax2.hist(chain_after_burnin, bins=50, density=True, alpha=0.7, edgecolor='black')
ax2.axvline(np.mean(chain_after_burnin), color='red', linestyle='--', 
            linewidth=2, label=f'Mean: {np.mean(chain_after_burnin):.4f}')
ax2.axvline(n_heads / n_flips, color='green', linestyle='--', 
            linewidth=2, label=f'Observed: {n_heads / n_flips:.4f}')
ax2.set_xlabel('Parameter value (p)')
ax2.set_ylabel('Density')
ax2.set_title('Posterior Distribution of Coin Bias')
ax2.legend()
ax2.grid(True, alpha=0.3)

plt.tight_layout()
plt.savefig('/mnt/user-data/outputs/mcmc_results.png', dpi=150, bbox_inches='tight')
print("\n✓ Saved plot to mcmc_results.png")
plt.show()

# ============================================================================
# Interpretation
# ============================================================================

print("\n" + "="*70)
print("WHAT THIS MEANS:")
print("="*70)
print(f"""
1. We flipped a coin {n_flips} times and got {n_heads} heads.

2. MCMC generated {len(chain):,} samples from the posterior distribution.

3. The posterior tells us: "Given the data, what are the possible values
   of the coin's bias, and how likely is each one?"

4. The trace plot shows how MCMC walked around the parameter space.
   After burn-in (red line), it settled in the region that fits the data well.

5. The histogram shows the posterior distribution. It's peaked around
   {np.mean(chain_after_burnin):.3f}, which makes sense because that's close to
   the observed proportion of heads ({n_heads/n_flips:.3f}).

6. The 95% credible interval [{np.percentile(chain_after_burnin, 2.5):.3f}, {np.percentile(chain_after_burnin, 97.5):.3f}]
   means: "There's a 95% probability the true coin bias is in this range."

7. This is direct and intuitive! With frequentist confidence intervals,
   you'd have to say: "If I repeated this experiment many times, my
   procedure would contain the true value 95% of the time." Much more awkward!
""")
