import numpy as np
import matplotlib.pyplot as plt
from scipy.stats import beta

# ============================================================================
# BAYESIAN A/B TEST: Funnel conversion rate improvement
# ============================================================================

# Set seed for reproducibility
np.random.seed(42)

# ============================================================================
# Prior: Based on historical data (10% baseline conversion)
# ============================================================================

# Beta(100, 900) encodes: "conversion is probably around 10%"
# - 100 'successes', 900 'failures' from historical data
# - Mean: 100/(100+900) = 0.10
prior_alpha = 100
prior_beta = 900

print("="*70)
print("PRIOR DISTRIBUTION (Based on historical 10% baseline)")
print("="*70)
prior_mean = prior_alpha / (prior_alpha + prior_beta)
prior_std = np.sqrt((prior_alpha * prior_beta) / 
                     ((prior_alpha + prior_beta)**2 * (prior_alpha + prior_beta + 1)))
print(f"Prior distribution: Beta({prior_alpha}, {prior_beta})")
print(f"  Mean: {prior_mean:.4f}")
print(f"  Std Dev: {prior_std:.4f}")
print(f"  95% Prior Interval: [{beta.ppf(0.025, prior_alpha, prior_beta):.4f}, {beta.ppf(0.975, prior_alpha, prior_beta):.4f}]")

# ============================================================================
# Data from A/B test
# ============================================================================

# Control group (old funnel)
control_conversions = 95
control_visitors = 950
control_non_conversions = control_visitors - control_conversions

# Treatment group (new funnel with improvement)
treatment_conversions = 126
treatment_visitors = 1050
treatment_non_conversions = treatment_visitors - treatment_conversions

print(f"\n" + "="*70)
print("EXPERIMENT DATA")
print("="*70)
print(f"Control:   {control_conversions}/{control_visitors} = {control_conversions/control_visitors:.4f}")
print(f"Treatment: {treatment_conversions}/{treatment_visitors} = {treatment_conversions/treatment_visitors:.4f}")
print(f"Observed difference: {(treatment_conversions/treatment_visitors) - (control_conversions/control_visitors):.4f}")

# ============================================================================
# Bayesian Update: Conjugate prior + binomial likelihood = Beta posterior
# ============================================================================

# For Beta-Binomial conjugacy:
# Posterior = Beta(prior_alpha + successes, prior_beta + failures)

control_posterior_alpha = prior_alpha + control_conversions
control_posterior_beta = prior_beta + control_non_conversions

treatment_posterior_alpha = prior_alpha + treatment_conversions
treatment_posterior_beta = prior_beta + treatment_non_conversions

print(f"\n" + "="*70)
print("POSTERIOR DISTRIBUTIONS (After seeing experiment data)")
print("="*70)

control_posterior_mean = control_posterior_alpha / (control_posterior_alpha + control_posterior_beta)
control_posterior_std = np.sqrt((control_posterior_alpha * control_posterior_beta) / 
                                ((control_posterior_alpha + control_posterior_beta)**2 * 
                                 (control_posterior_alpha + control_posterior_beta + 1)))

treatment_posterior_mean = treatment_posterior_alpha / (treatment_posterior_alpha + treatment_posterior_beta)
treatment_posterior_std = np.sqrt((treatment_posterior_alpha * treatment_posterior_beta) / 
                                  ((treatment_posterior_alpha + treatment_posterior_beta)**2 * 
                                   (treatment_posterior_alpha + treatment_posterior_beta + 1)))

print(f"Control Posterior: Beta({control_posterior_alpha}, {control_posterior_beta})")
print(f"  Mean: {control_posterior_mean:.4f}")
print(f"  Std Dev: {control_posterior_std:.4f}")
print(f"  95% Credible Interval: [{beta.ppf(0.025, control_posterior_alpha, control_posterior_beta):.4f}, {beta.ppf(0.975, control_posterior_alpha, control_posterior_beta):.4f}]")

print(f"\nTreatment Posterior: Beta({treatment_posterior_alpha}, {treatment_posterior_beta})")
print(f"  Mean: {treatment_posterior_mean:.4f}")
print(f"  Std Dev: {treatment_posterior_std:.4f}")
print(f"  95% Credible Interval: [{beta.ppf(0.025, treatment_posterior_alpha, treatment_posterior_beta):.4f}, {beta.ppf(0.975, treatment_posterior_alpha, treatment_posterior_beta):.4f}]")

# ============================================================================
# Key Questions (MCMC sampling to answer comparative questions)
# ============================================================================

print(f"\n" + "="*70)
print("KEY BUSINESS QUESTIONS")
print("="*70)

# Sample from both posteriors
n_samples = 100000
control_samples = np.random.beta(control_posterior_alpha, control_posterior_beta, n_samples)
treatment_samples = np.random.beta(treatment_posterior_alpha, treatment_posterior_beta, n_samples)

# Question 1: Probability that treatment is better than control
prob_treatment_better = np.mean(treatment_samples > control_samples)
print(f"\n1. Probability treatment > control: {prob_treatment_better:.4f} ({prob_treatment_better*100:.2f}%)")

# Question 2: Probability that treatment improves by at least 1%
prob_improvement_1pct = np.mean((treatment_samples - control_samples) > 0.01)
print(f"2. Probability improvement > 1%: {prob_improvement_1pct:.4f} ({prob_improvement_1pct*100:.2f}%)")

# Question 3: Expected lift
expected_lift = np.mean(treatment_samples - control_samples)
print(f"3. Expected lift: {expected_lift:.4f} ({expected_lift*100:.2f} percentage points)")

# Question 4: 95% Credible interval for the difference
diff_samples = treatment_samples - control_samples
ci_lower = np.percentile(diff_samples, 2.5)
ci_upper = np.percentile(diff_samples, 97.5)
print(f"4. 95% CI for treatment - control: [{ci_lower:.4f}, {ci_upper:.4f}]")
print(f"   ({ci_lower*100:.2f}% to {ci_upper*100:.2f}% improvement)")

# Question 5: What's the worst-case scenario (5th percentile)?
worst_case = np.percentile(diff_samples, 5)
print(f"5. 5th percentile (worst case): {worst_case:.4f} ({worst_case*100:.2f}% improvement)")

# ============================================================================
# Visualization
# ============================================================================

fig, axes = plt.subplots(2, 2, figsize=(14, 10))

# Plot 1: Prior vs Posteriors for control
ax = axes[0, 0]
x = np.linspace(0, 0.2, 1000)
ax.plot(x, beta.pdf(x, prior_alpha, prior_beta), 'gray', linewidth=2, label='Prior')
ax.plot(x, beta.pdf(x, control_posterior_alpha, control_posterior_beta), 'blue', linewidth=2, label='Posterior')
ax.fill_between(x, beta.pdf(x, control_posterior_alpha, control_posterior_beta), alpha=0.3, color='blue')
ax.axvline(control_posterior_mean, color='blue', linestyle='--', linewidth=2, label=f'Mean: {control_posterior_mean:.4f}')
ax.set_xlabel('Conversion Rate (p)')
ax.set_ylabel('Density')
ax.set_title('Control Group Posterior')
ax.legend()
ax.grid(True, alpha=0.3)

# Plot 2: Prior vs Posteriors for treatment
ax = axes[0, 1]
ax.plot(x, beta.pdf(x, prior_alpha, prior_beta), 'gray', linewidth=2, label='Prior')
ax.plot(x, beta.pdf(x, treatment_posterior_alpha, treatment_posterior_beta), 'green', linewidth=2, label='Posterior')
ax.fill_between(x, beta.pdf(x, treatment_posterior_alpha, treatment_posterior_beta), alpha=0.3, color='green')
ax.axvline(treatment_posterior_mean, color='green', linestyle='--', linewidth=2, label=f'Mean: {treatment_posterior_mean:.4f}')
ax.set_xlabel('Conversion Rate (p)')
ax.set_ylabel('Density')
ax.set_title('Treatment Group Posterior')
ax.legend()
ax.grid(True, alpha=0.3)

# Plot 3: Both posteriors overlaid
ax = axes[1, 0]
ax.plot(x, beta.pdf(x, control_posterior_alpha, control_posterior_beta), 'blue', linewidth=2, label='Control')
ax.plot(x, beta.pdf(x, treatment_posterior_alpha, treatment_posterior_beta), 'green', linewidth=2, label='Treatment')
ax.fill_between(x, beta.pdf(x, control_posterior_alpha, control_posterior_beta), alpha=0.2, color='blue')
ax.fill_between(x, beta.pdf(x, treatment_posterior_alpha, treatment_posterior_beta), alpha=0.2, color='green')
ax.set_xlabel('Conversion Rate (p)')
ax.set_ylabel('Density')
ax.set_title('Comparing Control vs Treatment')
ax.legend()
ax.grid(True, alpha=0.3)

# Plot 4: Distribution of difference (treatment - control)
ax = axes[1, 1]
ax.hist(diff_samples, bins=100, density=True, alpha=0.7, edgecolor='black', color='purple')
ax.axvline(expected_lift, color='red', linestyle='--', linewidth=2, label=f'Expected lift: {expected_lift:.4f}')
ax.axvline(ci_lower, color='orange', linestyle='--', linewidth=2, label=f'95% CI: [{ci_lower:.4f}, {ci_upper:.4f}]')
ax.axvline(ci_upper, color='orange', linestyle='--', linewidth=2)
ax.axvline(0, color='black', linestyle='-', linewidth=1, alpha=0.5)
ax.set_xlabel('Difference: Treatment - Control')
ax.set_ylabel('Density')
ax.set_title(f'Posterior Distribution of Lift\n(P(treatment > control) = {prob_treatment_better:.2%})')
ax.legend()
ax.grid(True, alpha=0.3)

plt.tight_layout()
plt.savefig('/mnt/user-data/outputs/bayesian_ab_test_results.png', dpi=150, bbox_inches='tight')
print(f"\n✓ Saved visualization to bayesian_ab_test_results.png")
plt.show()

# ============================================================================
# Interpretation and Decision
# ============================================================================

print(f"\n" + "="*70)
print("INTERPRETATION & DECISION")
print("="*70)
print(f"""
Given the data and your prior belief (10% baseline):

1. Your treatment likely improved conversion from ~10% to ~12%

2. There's a {prob_treatment_better*100:.1f}% probability the treatment is actually better

3. On average, you'd expect about a {expected_lift*100:.2f} percentage point improvement

4. You can be 95% confident the true improvement is between 
   {ci_lower*100:.2f}% and {ci_upper*100:.2f}% (in percentage points)

DECISION FRAMEWORK:
- If your cost of deployment < expected benefit: SHIP IT
- If there's a {prob_treatment_better*100:.1f}% chance of improvement, that's likely good enough
- You can quantify the risk: 5% chance of {worst_case*100:.2f}% or worse

COMPARISON TO FREQUENTIST:
- Frequentist: Would do a hypothesis test, get a p-value
- Bayesian: Direct probability statements about what actually matters
  (is treatment better? by how much? what's the probability?)
""")
