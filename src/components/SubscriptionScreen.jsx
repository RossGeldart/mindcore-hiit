import React from 'react';
import { motion } from 'framer-motion';
import { Check, Loader2, ArrowLeft, Star, Crown, Zap, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PlanCard = ({ 
  title, 
  price, 
  period, 
  features, 
  recommended, 
  onSelect, 
  loading, 
  type,
  currentPlan
}) => {
  const isCurrent = currentPlan === type;

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className={`relative rounded-3xl p-5 flex flex-col h-full border-2 transition-all duration-300 ${
        recommended 
          ? 'bg-primary/5 border-primary shadow-xl shadow-primary/10' 
          : 'bg-card border-border hover:border-primary/50'
      }`}
    >
      {recommended && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
          <Star className="w-2.5 h-2.5 fill-current" />
          MOST POPULAR
        </div>
      )}

      <div className="mb-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">{title}</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-black text-foreground">{price}</span>
          {period && <span className="text-muted-foreground font-medium text-sm">/{period}</span>}
        </div>
        {type !== 'lifetime' && (
          <p className="text-xs text-green-600 font-semibold mt-1 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> 7-Day Free Trial
          </p>
        )}
      </div>

      <ul className="space-y-2 mb-6 flex-1">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2.5 text-xs">
            <div className="mt-0.5 min-w-4 min-h-4 rounded-full bg-primary/10 flex items-center justify-center">
              <Check className="w-2.5 h-2.5 text-primary" />
            </div>
            <span className="text-muted-foreground">{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        onClick={() => onSelect(type)}
        disabled={loading || isCurrent}
        className={`w-full font-bold h-10 rounded-xl text-sm ${
          recommended 
            ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25' 
            : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'
        }`}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isCurrent ? (
          "Current Plan"
        ) : (
          type === 'lifetime' ? "Get Lifetime Access" : "Start Free Trial"
        )}
      </Button>
    </motion.div>
  );
};

const SubscriptionScreen = ({ 
    onBack, 
    currentSubscription, 
    onPlanSelect, 
    isCheckoutLoading 
}) => {
  const isSubscribed = currentSubscription && ['active', 'trialing', 'lifetime'].includes(currentSubscription.status);
  const [localLoading, setLocalLoading] = React.useState(null);

  const handleSelect = (planType) => {
      setLocalLoading(planType);
      onPlanSelect(planType);
  };

  React.useEffect(() => {
      if (!isCheckoutLoading) {
          setLocalLoading(null);
      }
  }, [isCheckoutLoading]);

  return (
    <div className="min-h-screen bg-background text-foreground p-5 pt-16 pb-12 overflow-x-hidden">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
            <Button 
                variant="ghost" 
                onClick={onBack} 
                className="pl-0 hover:bg-transparent hover:text-primary transition-colors h-8"
            >
                <ArrowLeft className="w-5 h-5 mr-1.5" />
                Back to Profile
            </Button>
        </div>

        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center justify-center p-2.5 bg-primary/10 rounded-xl mb-4 text-primary"
          >
            <Crown className="w-6 h-6" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl font-black tracking-tight mb-2"
          >
            {isSubscribed ? "Manage Subscription" : "Unlock Full Access"}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base text-muted-foreground max-w-xl mx-auto"
          >
            {isSubscribed 
              ? "You're all set! Enjoy your premium workout experience." 
              : "Upgrade today to unlock detailed stats, streak tracking, and advanced insights."}
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="h-full"
          >
            <PlanCard 
              title="Monthly"
              type="monthly"
              price="£6.99"
              period="mo"
              features={[
                "Unlimited workout generation",
                "Ad-free experience",
                "7-day free trial"
              ]}
              onSelect={handleSelect}
              loading={localLoading === 'monthly' || (isCheckoutLoading && localLoading === 'monthly')}
              currentPlan={currentSubscription?.plan_type}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="h-full"
          >
            <PlanCard 
              title="Annual"
              type="annual"
              price="£29.99"
              period="yr"
              recommended={true}
              features={[
                "Everything in Monthly",
                "Priority support",
                "Save 64% vs Monthly",
                "7-day free trial"
              ]}
              onSelect={handleSelect}
              loading={localLoading === 'annual' || (isCheckoutLoading && localLoading === 'annual')}
              currentPlan={currentSubscription?.plan_type}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="h-full"
          >
            <PlanCard 
              title="Lifetime"
              type="lifetime"
              price="£99.99"
              period={null}
              features={[
                "One-time payment",
                "Lifetime access to all features",
                "Future Pro updates included",
                "VIP badge on profile",
                "No recurring fees ever"
              ]}
              onSelect={handleSelect}
              loading={localLoading === 'lifetime' || (isCheckoutLoading && localLoading === 'lifetime')}
              currentPlan={currentSubscription?.plan_type}
            />
          </motion.div>
        </div>

        <div className="mt-12 text-center text-xs text-muted-foreground max-w-xl mx-auto bg-card/50 p-4 rounded-xl border border-border">
          <div className="flex justify-center mb-2">
            <Zap className="w-5 h-5 text-yellow-500" />
          </div>
          <p>
            Payments are processed securely by Stripe. You can cancel your subscription at any time.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionScreen;