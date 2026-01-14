
import React from 'react'; 
import { ArrowLeft, Shield, Lock, Eye, Database, Server, FileText, UserCheck, Mail, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';

const Section = ({ icon: Icon, title, children, delay }) => (
  <motion.section 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    className="bg-card border border-border/50 rounded-2xl p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
  >
    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-8 -mt-8 pointer-events-none" />
    
    <div className="flex items-center gap-4 mb-6 relative z-10">
      <div className="p-3 bg-primary/10 rounded-xl text-primary">
        <Icon className="w-6 h-6" />
      </div>
      <h2 className="text-xl md:text-2xl font-bold text-foreground">{title}</h2>
    </div>
    
    <div className="prose dark:prose-invert max-w-none text-muted-foreground relative z-10 leading-relaxed">
      {children}
    </div>
  </motion.section>
);

const PrivacyPolicy = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <Helmet>
        <title>Privacy Policy - Mind Core HIIT</title>
        <meta name="description" content="Privacy Policy for Mind Core HIIT. Learn how we handle your data, security practices, and your rights." />
      </Helmet>

      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground hover:text-primary hover:bg-primary/10 -ml-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to App
          </Button>
          <span className="text-sm font-medium text-muted-foreground hidden sm:block">Mind Core HIIT</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-12">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center mb-16"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-primary/20 transform rotate-3">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">Privacy Policy</h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            We value your trust. This policy outlines how we protect your personal data and respect your privacy rights.
          </p>
          <div className="mt-4 inline-flex items-center text-sm font-medium text-muted-foreground bg-muted/50 px-4 py-2 rounded-full">
            Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
        </motion.div>

        <div className="space-y-8">
          {/* 1. Data Collection */}
          <Section icon={Database} title="1. Information We Collect" delay={0.1}>
            <p className="mb-4">
              We collect information to provide you with a personalized fitness experience. This data is categorized as follows:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-foreground">Account Information:</strong> When you sign up, we collect your email address and authentication credentials (managed securely via Supabase).
              </li>
              <li>
                <strong className="text-foreground">Profile Data:</strong> Information you voluntarily provide, such as your display name, avatar image, and bio.
              </li>
              <li>
                <strong className="text-foreground">Workout Data:</strong> We store details of the workouts you generate, complete, and save, including duration, equipment used, and performance metrics (e.g., total minutes, streaks).
              </li>
              <li>
                <strong className="text-foreground">Community Content:</strong> Posts, comments, and other content you choose to share in the community section.
              </li>
              <li>
                <strong className="text-foreground">Technical Data:</strong> Minimal device information and usage logs to ensure app stability and performance.
              </li>
            </ul>
          </Section>

          {/* 2. Data Storage & Infrastructure */}
          <Section icon={Server} title="2. Data Storage & Infrastructure" delay={0.2}>
            <p className="mb-4">
              Your data is stored securely in the cloud using enterprise-grade infrastructure.
            </p>
            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              <div className="bg-muted/30 p-4 rounded-xl border border-border/50">
                <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                   <Globe className="w-4 h-4 text-green-500" /> Database Hosting
                </h3>
                <p className="text-sm">We utilize <strong>Supabase</strong>, a secure open-source Firebase alternative, hosted on AWS infrastructure.</p>
              </div>
              <div className="bg-muted/30 p-4 rounded-xl border border-border/50">
                <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                   <Lock className="w-4 h-4 text-purple-500" /> Encryption
                </h3>
                <p className="text-sm">Data is encrypted in transit using SSL/TLS and at rest within our database infrastructure.</p>
              </div>
            </div>
          </Section>

          {/* 3. User Rights */}
          <Section icon={UserCheck} title="3. Your Rights" delay={0.3}>
            <p className="mb-4">
              You maintain full ownership and control over your personal data. Under GDPR and similar privacy regulations, you have the right to:
            </p>
            <ul className="space-y-3">
              <li className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span><strong>Access:</strong> View all personal data we hold about you directly through your Profile page.</span>
              </li>
              <li className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span><strong>Correction:</strong> Update your profile information, avatar, and preferences at any time.</span>
              </li>
              <li className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span><strong>Deletion:</strong> Request complete deletion of your account and all associated data. This action is permanent and cannot be undone.</span>
              </li>
              <li className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span><strong>Export:</strong> Request a copy of your data in a machine-readable format.</span>
              </li>
            </ul>
          </Section>

           {/* 4. Third Party Services */}
           <Section icon={Globe} title="4. Third-Party Services" delay={0.4}>
            <p className="mb-4">
              We partner with trusted service providers to deliver our services. We do not sell your data to third parties.
            </p>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-muted/20 rounded-lg">
                <div className="font-bold min-w-[100px] text-foreground">Supabase</div>
                <div>Provides authentication, database, and backend services. Privacy Policy available at supabase.com/privacy.</div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-muted/20 rounded-lg">
                <div className="font-bold min-w-[100px] text-foreground">Stripe</div>
                <div>Securely processes payments for premium subscriptions. We do not store your full credit card information.</div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-muted/20 rounded-lg">
                <div className="font-bold min-w-[100px] text-foreground">Spotify</div>
                <div>Embedded music players allow you to listen to music during workouts. Usage is subject to Spotify's terms.</div>
              </div>
            </div>
          </Section>

          {/* 5. Security Practices */}
          <Section icon={Lock} title="5. Security Practices" delay={0.5}>
            <p>
              We implement robust security measures to protect your information:
            </p>
            <ul className="list-disc pl-5 mt-3 space-y-2">
              <li><strong>Secure Authentication:</strong> We use industry-standard authentication (OAuth/Magic Links) so we never have to store your actual password.</li>
              <li><strong>Row Level Security (RLS):</strong> Our database uses strict policies to ensure users can only access data they are authorized to see.</li>
              <li><strong>HTTPS Only:</strong> All traffic to and from our application is forced over secure HTTPS connections.</li>
            </ul>
          </Section>

          {/* 6. Contact Us */}
          <Section icon={Mail} title="Contact Us" delay={0.6}>
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <p className="mb-2">
                  If you have questions about this Privacy Policy, data practices, or would like to exercise your rights, please contact our Data Protection Officer:
                </p>
                <a href="mailto:ross@mindcorehiitgenerator.com" className="text-primary font-bold hover:underline text-lg">
                  ross@mindcorehiitgenerator.com
                </a>
              </div>
              <Button onClick={() => window.location.href = 'mailto:ross@mindcorehiitgenerator.com'}>
                Send Email
              </Button>
            </div>
          </Section>
        </div>

        <div className="mt-16 text-center border-t border-border pt-8 text-muted-foreground text-sm">
          <p>© {new Date().getFullYear()} Mind Core HIIT. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
