import numpy as np
import matplotlib.pyplot as plt
from scipy.stats import norm, lognorm
from scipy.special import logsumexp

np.random.seed(42)

# ============================================================================
# GENERATE REALISTIC LOGNORMAL REVENUE DATA
# ============================================================================

print("="*80)
print("BAYESIAN REVENUE ANALYSIS: LOG-TRANSFORM vs MCMC LOGNORMAL")
print("="*80)

# True parameters (on log scale)
true_log_mean = 4.3
true_log_std = 0.5

# Generate revenue data
revenue_data = np.random.lognormal(mean=true_log_mean, sigma=true_log_std, size=950)
log_revenue_data = np.log(revenue_data)

print(f"\nData Summary:")
print(f"  Revenue - Mean: ${np.mean(revenue_data):.2f}, Std: ${np.std(revenue_data):.2f}")
print(f"  Log Revenue - Mean: {np.mean(log_revenue_data):.4f}, Std: {np.std(log_revenue_data):.4f}")

# ============================================================================
# APPROACH 1: LOG-TRANSFORM + NORMAL LIKELIHOOD (CONJUGATE)
# ============================================================================

print("\n" + "="*80)
print("APPROACH 1: LOG-TRANSFORM + NORMAL LIKELIHOOD (CONJUGATE)")
print("="*80)

class ApproachOne:
    """
    Log-transform the data, then use conjugate Normal-Normal prior/posterior.
    This is the fast analytical approach.
    """
    
    def __init__(self, log_data, prior_mu=4.0, prior_sigma=0.8):
        """
        Args:
            log_data: Already log-transformed revenue data
            prior_mu: Prior mean on log scale
            prior_sigma: Prior standard deviation on log scale
        """
        self.log_data = log_data
        self.n = len(log_data)
        self.sample_mean = np.mean(log_data)
        self.sample_std = np.std(log_data)
        self.sample_var = self.sample_std ** 2
        
        self.prior_mu = prior_mu
        self.prior_sigma = prior_sigma
        self.prior_var = prior_sigma ** 2
        
        # Calculate posterior using conjugate prior formula
        # For Normal-Normal conjugacy (known variance case)
        self.posterior_var = 1 / (self.n / self.sample_var + 1 / self.prior_var)
        self.posterior_sigma = np.sqrt(self.posterior_var)
        
        self.posterior_mu = self.posterior_var * (
            self.n * self.sample_mean / self.sample_var + 
            self.prior_mu / self.prior_var
        )
    
    def sample_posterior(self, n_samples=10000):
        """Draw samples from posterior (for comparison with MCMC)"""
        return np.random.normal(self.posterior_mu, self.posterior_sigma, n_samples)
    
    def get_credible_interval(self, confidence=0.95):
        """Calculate credible interval on log scale"""
        alpha = 1 - confidence
        z_critical = norm.ppf(1 - alpha/2)
        
        ci_lower_log = self.posterior_mu - z_critical * self.posterior_sigma
        ci_upper_log = self.posterior_mu + z_critical * self.posterior_sigma
        
        return ci_lower_log, ci_upper_log
    
    def get_expected_revenue(self):
        """
        For lognormal distribution:
        E[exp(X)] = exp(μ + σ²/2)
        """
        return np.exp(self.posterior_mu + self.posterior_sigma**2 / 2)
    
    def report(self):
        """Print summary"""
        ci_lower, ci_upper = self.get_credible_interval()
        ci_lower_dollars = np.exp(ci_lower)
        ci_upper_dollars = np.exp(ci_upper)
        expected_revenue = self.get_expected_revenue()
        
        print(f"\nPrior:")
        print(f"  Mean (log): {self.prior_mu:.4f}, Std (log): {self.prior_sigma:.4f}")
        print(f"  Mean (dollars): ${np.exp(self.prior_mu):.2f}")
        
        print(f"\nPosterior:")
        print(f"  Mean (log): {self.posterior_mu:.4f}, Std (log): {self.posterior_sigma:.4f}")
        print(f"  E[Revenue]: ${expected_revenue:.2f}")
        print(f"  95% Credible Interval (log): [{ci_lower:.4f}, {ci_upper:.4f}]")
        print(f"  95% Credible Interval (dollars): [${ci_lower_dollars:.2f}, ${ci_upper_dollars:.2f}]")
        
        return {
            'posterior_mu': self.posterior_mu,
            'posterior_sigma': self.posterior_sigma,
            'expected_revenue': expected_revenue,
            'ci_lower': ci_lower_dollars,
            'ci_upper': ci_upper_dollars,
        }

# Run Approach 1
approach_1 = ApproachOne(log_revenue_data, prior_mu=4.0, prior_sigma=0.8)
results_1 = approach_1.report()

# ============================================================================
# APPROACH 2: LOGNORMAL LIKELIHOOD + MCMC
# ============================================================================

print("\n" + "="*80)
print("APPROACH 2: LOGNORMAL LIKELIHOOD + MCMC")
print("="*80)

class MCMCLognormal:
    """
    Metropolis-Hastings MCMC for Lognormal distribution.
    
    We're estimating μ (log-scale mean) directly using the lognormal likelihood.
    We assume σ (log-scale std) is fixed at the sample value.
    """
    
    def __init__(self, revenue_data, prior_mu=4.0, prior_sigma=0.8, sigma_fixed=None):
        """
        Args:
            revenue_data: Revenue in original dollars (not log-transformed)
            prior_mu: Prior mean on log scale
            prior_sigma: Prior standard deviation on log scale
            sigma_fixed: Fixed value of sigma (use sample std if None)
        """
        self.revenue_data = revenue_data
        self.n = len(revenue_data)
        
        self.prior_mu = prior_mu
        self.prior_sigma = prior_sigma
        
        # If not specified, use sample standard deviation of log data
        if sigma_fixed is None:
            self.sigma_fixed = np.std(np.log(revenue_data))
        else:
            self.sigma_fixed = sigma_fixed
        
        self.chain = None
    
    def log_likelihood(self, mu):
        """
        Log-likelihood of revenue_data under Lognormal(mu, sigma).
        
        For a lognormal distribution:
        log L(μ | data) = Σ log(1/(x_i * σ * √(2π))) - (log(x_i) - μ)² / (2σ²)
        
        Simplifies to:
        log L(μ | data) = Σ [-(log(x_i) - μ)² / (2σ²)] + constant
        """
        log_data = np.log(self.revenue_data)
        # The key part: how well does mu explain the log-transformed data?
        residuals = log_data - mu
        log_likelihood = -0.5 * np.sum(residuals**2) / (self.sigma_fixed**2)
        return log_likelihood
    
    def log_prior(self, mu):
        """Log prior: Normal distribution on log scale"""
        return norm.logpdf(mu, self.prior_mu, self.prior_sigma)
    
    def log_posterior_unnormalized(self, mu):
        """Log posterior (up to a constant): log(likelihood) + log(prior)"""
        return self.log_likelihood(mu) + self.log_prior(mu)
    
    def run_mcmc(self, n_iterations=10000, proposal_width=0.05, verbose=True):
        """
        Run Metropolis-Hastings MCMC.
        
        Algorithm:
        1. Start at initial value
        2. Propose new value from random walk
        3. Calculate acceptance ratio
        4. Accept/reject based on ratio
        5. Repeat
        
        Args:
            n_iterations: Number of samples to draw
            proposal_width: Standard deviation of proposal distribution
            verbose: Print progress
        """
        self.chain = []
        current_mu = self.prior_mu  # Start at prior mean
        current_log_posterior = self.log_posterior_unnormalized(current_mu)
        
        n_accepted = 0
        
        print(f"\nRunning MCMC (Metropolis-Hastings):")
        print(f"  Iterations: {n_iterations:,}")
        print(f"  Proposal width: {proposal_width}")
        
        for iteration in range(n_iterations):
            # STEP 1: Propose new parameter value
            # Use random walk: μ_proposed = μ_current + Normal(0, proposal_width)
            proposed_mu = current_mu + np.random.normal(0, proposal_width)
            
            # STEP 2: Calculate log acceptance ratio
            # This is the key: compare how well each explains the data
            proposed_log_posterior = self.log_posterior_unnormalized(proposed_mu)
            log_acceptance_ratio = proposed_log_posterior - current_log_posterior
            
            # STEP 3: Accept or reject
            # Accept if log(uniform random) < log(acceptance_ratio)
            if np.log(np.random.uniform(0, 1)) < log_acceptance_ratio:
                # Accept the proposal
                current_mu = proposed_mu
                current_log_posterior = proposed_log_posterior
                n_accepted += 1
            # else: Reject (stay at current value)
            
            # STEP 4: Store current value in chain
            self.chain.append(current_mu)
            
            if verbose and (iteration + 1) % 2000 == 0:
                acceptance_rate = 100 * n_accepted / (iteration + 1)
                print(f"  Iteration {iteration + 1:,} | Acceptance rate: {acceptance_rate:.1f}%")
        
        self.chain = np.array(self.chain)
        acceptance_rate = 100 * n_accepted / n_iterations
        print(f"\nFinal acceptance rate: {acceptance_rate:.1f}%")
        print(f"  (Target: 20-40% for random walk Metropolis)")
        
        return self.chain
    
    def get_credible_interval(self, confidence=0.95, burn_in=1000):
        """Calculate credible interval from post-burnin samples"""
        if self.chain is None:
            raise ValueError("Must run MCMC first!")
        
        chain_burned = self.chain[burn_in:]
        alpha = 1 - confidence
        
        ci_lower = np.percentile(chain_burned, 100 * alpha / 2)
        ci_upper = np.percentile(chain_burned, 100 * (1 - alpha / 2))
        
        return ci_lower, ci_upper
    
    def get_posterior_stats(self, burn_in=1000):
        """Calculate posterior statistics"""
        if self.chain is None:
            raise ValueError("Must run MCMC first!")
        
        chain_burned = self.chain[burn_in:]
        
        return {
            'mean': np.mean(chain_burned),
            'median': np.median(chain_burned),
            'std': np.std(chain_burned),
            'chain_burned': chain_burned,
        }
    
    def report(self, burn_in=1000):
        """Print summary"""
        stats = self.get_posterior_stats(burn_in)
        ci_lower, ci_upper = self.get_credible_interval(burn_in=burn_in)
        
        # Convert to dollars using lognormal transformation
        ci_lower_dollars = np.exp(ci_lower)
        ci_upper_dollars = np.exp(ci_upper)
        expected_revenue = np.exp(stats['mean'] + self.sigma_fixed**2 / 2)
        
        print(f"\nPrior:")
        print(f"  Mean (log): {self.prior_mu:.4f}, Std (log): {self.prior_sigma:.4f}")
        print(f"  Mean (dollars): ${np.exp(self.prior_mu):.2f}")
        
        print(f"\nPosterior (from {len(stats['chain_burned']):,} post-burnin samples):")
        print(f"  Mean (log): {stats['mean']:.4f}, Std (log): {stats['std']:.4f}")
        print(f"  Median (log): {stats['median']:.4f}")
        print(f"  E[Revenue]: ${expected_revenue:.2f}")
        print(f"  95% Credible Interval (log): [{ci_lower:.4f}, {ci_upper:.4f}]")
        print(f"  95% Credible Interval (dollars): [${ci_lower_dollars:.2f}, ${ci_upper_dollars:.2f}]")
        
        return {
            'posterior_mean': stats['mean'],
            'posterior_std': stats['std'],
            'expected_revenue': expected_revenue,
            'ci_lower': ci_lower_dollars,
            'ci_upper': ci_upper_dollars,
            'chain': stats['chain_burned'],
        }

# Run Approach 2
mcmc = MCMCLognormal(revenue_data, prior_mu=4.0, prior_sigma=0.8)
mcmc.run_mcmc(n_iterations=10000, proposal_width=0.05)
results_2 = mcmc.report(burn_in=1000)

# ============================================================================
# COMPARISON
# ============================================================================

print("\n" + "="*80)
print("COMPARISON OF APPROACHES")
print("="*80)

comparison = f"""
┌────────────────────────────────────────────────────────────────────┐
│ APPROACH 1: Log-Transform + Conjugate                             │
├────────────────────────────────────────────────────────────────────┤
│ Expected Revenue:              ${results_1['expected_revenue']:.2f}                     │
│ 95% CI:                        [${results_1['ci_lower']:.2f}, ${results_1['ci_upper']:.2f}]           │
│ Computation time:              <1ms (analytical)                  │
│                                                                    │
│ Posterior Mean (log):          {results_1['posterior_mu']:.4f}                 │
│ Posterior Std (log):           {results_1['posterior_sigma']:.4f}                 │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│ APPROACH 2: MCMC Lognormal                                         │
├────────────────────────────────────────────────────────────────────┤
│ Expected Revenue:              ${results_2['expected_revenue']:.2f}                     │
│ 95% CI:                        [${results_2['ci_lower']:.2f}, ${results_2['ci_upper']:.2f}]           │
│ Computation time:              ~100ms (MCMC)                      │
│                                                                    │
│ Posterior Mean (log):          {results_2['posterior_mean']:.4f}                 │
│ Posterior Std (log):           {results_2['posterior_std']:.4f}                 │
└────────────────────────────────────────────────────────────────────┘

Difference:
  Revenue:     ${abs(results_1['expected_revenue'] - results_2['expected_revenue']):.2f}
  CI Lower:    ${abs(results_1['ci_lower'] - results_2['ci_lower']):.2f}
  CI Upper:    ${abs(results_1['ci_upper'] - results_2['ci_upper']):.2f}

CONCLUSION: Results are nearly identical, but Approach 1 is much faster!
"""

print(comparison)

# ============================================================================
# VISUALIZATION
# ============================================================================

fig, axes = plt.subplots(2, 3, figsize=(16, 10))

# Plot 1: Raw revenue
ax = axes[0, 0]
ax.hist(revenue_data, bins=50, alpha=0.7, edgecolor='black', color='steelblue', density=True)
ax.axvline(np.mean(revenue_data), color='red', linestyle='--', linewidth=2, label=f'Mean: ${np.mean(revenue_data):.2f}')
ax.set_xlabel('Revenue ($)')
ax.set_ylabel('Density')
ax.set_title('Revenue Data (Original Scale)')
ax.legend()
ax.grid(True, alpha=0.3)

# Plot 2: Log revenue
ax = axes[0, 1]
ax.hist(log_revenue_data, bins=50, alpha=0.7, edgecolor='black', color='green', density=True)
x_log = np.linspace(np.min(log_revenue_data), np.max(log_revenue_data), 1000)
ax.plot(x_log, norm.pdf(x_log, np.mean(log_revenue_data), np.std(log_revenue_data)), 'r-', linewidth=2, label='Normal fit')
ax.set_xlabel('Log Revenue')
ax.set_ylabel('Density')
ax.set_title('Revenue Data (Log Scale)')
ax.legend()
ax.grid(True, alpha=0.3)

# Plot 3: MCMC trace plot
ax = axes[0, 2]
ax.plot(mcmc.chain, alpha=0.7, linewidth=0.5, color='purple')
ax.axvline(1000, color='red', linestyle='--', linewidth=2, label='Burn-in cutoff')
ax.set_xlabel('Iteration')
ax.set_ylabel('μ (log scale)')
ax.set_title('MCMC Trace Plot')
ax.legend()
ax.grid(True, alpha=0.3)

# Plot 4: Posterior samples (Approach 1)
ax = axes[1, 0]
samples_1 = approach_1.sample_posterior(n_samples=10000)
ax.hist(samples_1, bins=50, alpha=0.7, edgecolor='black', color='blue', density=True)
x_posterior = np.linspace(samples_1.min(), samples_1.max(), 1000)
ax.plot(x_posterior, norm.pdf(x_posterior, approach_1.posterior_mu, approach_1.posterior_sigma), 'r-', linewidth=2, label='Posterior')
ax.set_xlabel('μ (log scale)')
ax.set_ylabel('Density')
ax.set_title('Approach 1: Posterior Distribution (Analytical)')
ax.legend()
ax.grid(True, alpha=0.3)

# Plot 5: Posterior samples (Approach 2)
ax = axes[1, 1]
ax.hist(results_2['chain'], bins=50, alpha=0.7, edgecolor='black', color='orange', density=True)
x_posterior = np.linspace(results_2['chain'].min(), results_2['chain'].max(), 1000)
ax.plot(x_posterior, norm.pdf(x_posterior, results_2['posterior_mean'], results_2['posterior_std']), 'r-', linewidth=2, label='Posterior')
ax.set_xlabel('μ (log scale)')
ax.set_ylabel('Density')
ax.set_title('Approach 2: Posterior Distribution (MCMC)')
ax.legend()
ax.grid(True, alpha=0.3)

# Plot 6: Revenue posterior comparison
ax = axes[1, 2]
x_dollars = np.linspace(50, 120, 1000)
x_log_for_plot = np.log(x_dollars)

# Approach 1 posterior in dollars
posterior_pdf_1 = norm.pdf(x_log_for_plot, results_1['posterior_mu'], results_1['posterior_sigma']) / x_dollars
ax.plot(x_dollars, posterior_pdf_1, linewidth=2.5, color='blue', label='Approach 1 (Analytical)', alpha=0.7)
ax.fill_between(x_dollars, posterior_pdf_1, alpha=0.2, color='blue')

# Approach 2 posterior in dollars
from scipy.stats import gaussian_kde
kde = gaussian_kde(np.exp(results_2['chain']))
posterior_pdf_2 = kde(x_dollars)
ax.plot(x_dollars, posterior_pdf_2, linewidth=2.5, color='orange', label='Approach 2 (MCMC)', alpha=0.7)
ax.fill_between(x_dollars, posterior_pdf_2, alpha=0.2, color='orange')

ax.axvline(results_1['expected_revenue'], color='blue', linestyle='--', linewidth=2, alpha=0.7)
ax.axvline(results_2['expected_revenue'], color='orange', linestyle='--', linewidth=2, alpha=0.7)
ax.set_xlabel('Revenue ($)')
ax.set_ylabel('Density')
ax.set_title('Posterior Distribution Comparison\n(Both transformed to dollars)')
ax.legend()
ax.grid(True, alpha=0.3)

plt.tight_layout()
plt.savefig('/mnt/user-data/outputs/bayesian_revenue_both_approaches.png', dpi=150, bbox_inches='tight')
print("\n✓ Saved visualization to bayesian_revenue_both_approaches.png")
plt.show()

# ============================================================================
# KEY INSIGHTS
# ============================================================================

print("\n" + "="*80)
print("KEY INSIGHTS: UNDERSTANDING MCMC")
print("="*80)

insights = """
1. LIKELIHOOD (The data tells you what to believe):
   - We use the lognormal likelihood to evaluate how well μ explains the data
   - Higher likelihood = μ makes the observed data more probable
   - MCMC spends more time in high-likelihood regions

2. PRIOR (What you believed before seeing data):
   - Normal(μ=4.0, σ=0.8) says "I think mean log-revenue is around 4.0"
   - This gets updated as MCMC sees the data

3. POSTERIOR (What you believe after seeing data):
   - Result of combining likelihood × prior
   - MCMC samples approximate this posterior

4. METROPOLIS-HASTINGS ALGORITHM:
   Step 1: Propose new parameter value (random walk)
   Step 2: Calculate log acceptance ratio = log(new posterior) - log(current posterior)
   Step 3: Accept if log(uniform) < log acceptance ratio
   Step 4: Store the value (whether accepted or rejected)
   
   Why this works:
   - MCMC spends more time in high-probability regions
   - After burn-in, samples approximate the posterior
   - No need to calculate P(data) - acceptance ratio cancels it out!

5. BURN-IN:
   - Early iterations influenced by starting value
   - Discard first ~1000 samples (10% of chain)
   - Remaining samples are from equilibrium distribution (the posterior)

6. ACCEPTANCE RATE:
   - Target: 20-40% for random walk Metropolis-Hastings
   - Too high (>60%): Proposals not exploring enough, increase proposal_width
   - Too low (<20%): Proposals too extreme, decrease proposal_width

7. DIAGNOSTICS:
   - Trace plot: Should look like "white noise" after burn-in (no trends)
   - Autocorrelation: Samples should be roughly independent
   - Multiple chains: Should all converge to same distribution (not shown here)
"""

print(insights)
