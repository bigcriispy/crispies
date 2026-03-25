import numpy as np
import matplotlib.pyplot as plt
from scipy.stats import binom, norm

np.random.seed(42)

# ============================================================================
# EXAMPLE 1: CONVERSION RATE (Binary outcome)
# ============================================================================

print("="*70)
print("EXAMPLE 1: CONVERSION RATE (Binary)")
print("="*70)

# Observed data: 95 conversions out of 950 visitors
n_visitors = 950
n_conversions = 95

print(f"\nObserved: {n_conversions} conversions out of {n_visitors} visitors")
print(f"Observed rate: {n_conversions/n_visitors:.4f}")

# Binomial likelihood function
def binomial_likelihood(p, conversions, total):
    """
    Probability of observing 'conversions' conversions
    if true rate is p and we have 'total' visitors
    
    Formula: P(data|p) = C(n,k) * p^k * (1-p)^(n-k)
    """
    # We can ignore the binomial coefficient C(n,k) since it's constant
    return (p ** conversions) * ((1 - p) ** (total - conversions))

# Evaluate likelihood at different parameter values
p_values = np.linspace(0, 0.3, 1000)
likelihoods_conversion = [binomial_likelihood(p, n_conversions, n_visitors) for p in p_values]

print("\nBinomial Likelihood Function:")
print(f"  P(95 conversions out of 950 | p=0.10) = {binomial_likelihood(0.10, n_conversions, n_visitors):.2e}")
print(f"  P(95 conversions out of 950 | p=0.09) = {binomial_likelihood(0.09, n_conversions, n_visitors):.2e}")
print(f"  P(95 conversions out of 950 | p=0.11) = {binomial_likelihood(0.11, n_conversions, n_visitors):.2e}")

# ============================================================================
# EXAMPLE 2: REVENUE (Continuous outcome)
# ============================================================================

print("\n" + "="*70)
print("EXAMPLE 2: REVENUE (Continuous)")
print("="*70)

# Simulate revenue data from 950 customers
# True distribution: Normal with mean=$75, std=$40
true_mean_revenue = 75
true_std_revenue = 40

# Generate simulated revenue data
revenue_data = np.random.normal(true_mean_revenue, true_std_revenue, n_visitors)
revenue_data = np.abs(revenue_data)  # Can't have negative revenue

print(f"\nObserved revenue data (n={n_visitors}):")
print(f"  Mean: ${np.mean(revenue_data):.2f}")
print(f"  Std Dev: ${np.std(revenue_data):.2f}")
print(f"  Min: ${np.min(revenue_data):.2f}")
print(f"  Max: ${np.max(revenue_data):.2f}")
print(f"  First 5 values: {revenue_data[:5].round(2)}")

# Normal likelihood function
def normal_likelihood(mu, sigma, data):
    """
    Probability of observing the revenue data
    if true mean is mu and true std dev is sigma
    
    For numerical stability, we use log-likelihood
    Formula: log P(data|μ,σ) = Σ log(1/(σ√2π)) - (x_i-μ)²/(2σ²)
    """
    log_likelihood = np.sum(norm.logpdf(data, loc=mu, scale=sigma))
    return np.exp(log_likelihood)

# Evaluate likelihood at different parameter values
mu_values = np.linspace(50, 100, 1000)
likelihoods_revenue = [normal_likelihood(mu, true_std_revenue, revenue_data) for mu in mu_values]

print("\nNormal Likelihood Function (fixing σ=40):")
print(f"  P(data | μ=75, σ=40) = {normal_likelihood(75, true_std_revenue, revenue_data):.2e}")
print(f"  P(data | μ=70, σ=40) = {normal_likelihood(70, true_std_revenue, revenue_data):.2e}")
print(f"  P(data | μ=80, σ=40) = {normal_likelihood(80, true_std_revenue, revenue_data):.2e}")

# ============================================================================
# Visualization
# ============================================================================

fig, axes = plt.subplots(2, 2, figsize=(14, 10))

# Plot 1: Binomial Likelihood
ax = axes[0, 0]
ax.plot(p_values, likelihoods_conversion, linewidth=2, color='blue')
ax.fill_between(p_values, likelihoods_conversion, alpha=0.3, color='blue')
ax.axvline(n_conversions/n_visitors, color='red', linestyle='--', linewidth=2, 
           label=f'Observed rate: {n_conversions/n_visitors:.4f}')
ax.set_xlabel('Parameter: p (conversion rate)')
ax.set_ylabel('Likelihood')
ax.set_title('Binomial Likelihood\n(Conversion Rate Example)')
ax.legend()
ax.grid(True, alpha=0.3)

# Plot 2: Normal Likelihood
ax = axes[0, 1]
ax.plot(mu_values, likelihoods_revenue, linewidth=2, color='green')
ax.fill_between(mu_values, likelihoods_revenue, alpha=0.3, color='green')
ax.axvline(np.mean(revenue_data), color='red', linestyle='--', linewidth=2, 
           label=f'Observed mean: ${np.mean(revenue_data):.2f}')
ax.set_xlabel('Parameter: μ (mean revenue)')
ax.set_ylabel('Likelihood')
ax.set_title('Normal Likelihood\n(Revenue Example)')
ax.legend()
ax.grid(True, alpha=0.3)

# Plot 3: Raw revenue data histogram
ax = axes[1, 0]
ax.hist(revenue_data, bins=50, alpha=0.7, edgecolor='black', color='green')
ax.axvline(np.mean(revenue_data), color='red', linestyle='--', linewidth=2, 
           label=f'Mean: ${np.mean(revenue_data):.2f}')
ax.set_xlabel('Revenue ($)')
ax.set_ylabel('Frequency')
ax.set_title('Distribution of Revenue Data')
ax.legend()
ax.grid(True, alpha=0.3)

# Plot 4: Comparison of likelihood functions (normalized)
ax = axes[1, 1]
# Normalize for comparison
likelihoods_conversion_norm = np.array(likelihoods_conversion) / np.max(likelihoods_conversion)
likelihoods_revenue_norm = np.array(likelihoods_revenue) / np.max(likelihoods_revenue)

ax.plot(p_values, likelihoods_conversion_norm, linewidth=2, color='blue', label='Binomial (Conversion)')
ax.plot(mu_values/100, likelihoods_revenue_norm, linewidth=2, color='green', label='Normal (Revenue)')
ax.set_xlabel('Parameter value (scaled)')
ax.set_ylabel('Normalized Likelihood')
ax.set_title('Likelihood Shape Comparison\n(Both normalized to [0,1])')
ax.legend()
ax.grid(True, alpha=0.3)

plt.tight_layout()
plt.savefig('/mnt/user-data/outputs/likelihood_comparison.png', dpi=150, bbox_inches='tight')
print("\n✓ Saved visualization to likelihood_comparison.png")
plt.show()

# ============================================================================
# Key Formulas Comparison
# ============================================================================

print("\n" + "="*70)
print("LIKELIHOOD FORMULAS COMPARISON")
print("="*70)

comparison = """
╔════════════════════════════════════════════════════════════════════╗
║                    BINOMIAL vs NORMAL LIKELIHOOD                  ║
╠════════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  BINOMIAL (Conversion Rate):                                      ║
║  ────────────────────────────                                    ║
║  L(p | data) = p^k * (1-p)^(n-k)                                 ║
║                                                                    ║
║  Where:                                                            ║
║    p = conversion rate (parameter we're estimating)               ║
║    k = number of conversions observed                             ║
║    n = total number of visitors                                   ║
║                                                                    ║
║  Example: 95 conversions out of 950                               ║
║    L(p=0.10) = 0.10^95 * 0.90^855 = 1.84e-98                    ║
║                                                                    ║
╠════════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  NORMAL (Revenue):                                                ║
║  ─────────────────                                               ║
║  L(μ,σ | data) = ∏ (1/(σ√(2π))) * exp(-(x_i - μ)²/(2σ²))       ║
║                                                                    ║
║  Where:                                                            ║
║    μ = mean revenue (parameter we're estimating)                  ║
║    σ = std dev of revenue (often also estimated)                  ║
║    x_i = individual revenue observations                          ║
║                                                                    ║
║  Example: mean=$75, std=$40                                       ║
║    L(μ=75, σ=40 | data) = 3.42e-1847                            ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝

KEY INSIGHT:
─────────────
The likelihood function MUST match the type of data you have:

  Binary outcome      → Binomial likelihood
  Continuous outcome  → Normal (or Gamma, Lognormal, etc.)
  Count data          → Poisson likelihood
  Survival time       → Weibull or Exponential likelihood

This is why your prior and likelihood must "fit" together!
"""

print(comparison)

# ============================================================================
# Bayesian Workflow Comparison
# ============================================================================

print("\n" + "="*70)
print("FULL BAYESIAN WORKFLOW COMPARISON")
print("="*70)

workflow = """
┌──────────────────────────────────────────────────────────────────┐
│ CONVERSION RATE                                                  │
├──────────────────────────────────────────────────────────────────┤
│ 1. Prior:       Beta(100, 900)      [bounded to [0,1]]          │
│ 2. Data:        Binary outcomes (convert or not)                │
│ 3. Likelihood:  Binomial                                        │
│ 4. Posterior:   Beta(195, 1755)     [using conjugacy]           │
│ 5. Output:      "85% confident treatment is better"             │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ REVENUE                                                          │
├──────────────────────────────────────────────────────────────────┤
│ 1. Prior:       Normal(μ=75, σ=15)  [unbounded]                │
│ 2. Data:        Continuous values ($0-$500 range)              │
│ 3. Likelihood:  Normal                                          │
│ 4. Posterior:   Normal(μ=72.5, σ=1.2) [using MCMC]            │
│ 5. Output:      "Mean revenue is probably $72.50"               │
└──────────────────────────────────────────────────────────────────┘
"""

print(workflow)
