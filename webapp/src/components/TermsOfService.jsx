
import React from 'react';
import { ArrowLeft, FileText, CheckCircle, AlertTriangle, Gavel, User, Shield, AlertOctagon, Scale, Mail, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';

const Section = ({ icon: Icon, title, children, delay, isWarning = false }) => (
  <motion.section 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    className={`bg-card border ${isWarning ? 'border-red-500/30 bg-red-500/5' : 'border-border/50'} rounded-2xl p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden`}
  >
    {!isWarning && <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-8 -mt-8 pointer-events-none" />}
    
    <div className="flex items-center gap-4 mb-6 relative z-10">
      <div className={`p-3 ${isWarning ? 'bg-red-500/20 text-red-500' : 'bg-primary/10 text-primary'} rounded-xl`}>
        <Icon className="w-6 h-6" />
      </div>
      <h2 className={`text-xl md:text-2xl font-bold ${isWarning ? 'text-red-500' : 'text-foreground'}`}>{title}</h2>
    </div>
    
    <div className="prose dark:prose-invert max-w-none text-muted-foreground relative z-10 leading-relaxed">
      {children}
    </div>
  </motion.section>
);

const TermsOfService = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <Helmet>
        <title>Terms of Service - Mind Core HIIT</title>
        <meta name="description" content="Terms of Service for Mind Core HIIT. Comprehensive usage guidelines, liability limitations, and user responsibilities." />
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
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-blue-500/20 transform -rotate-3">
            <Scale className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">Terms of Service</h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Please read these terms carefully before using Mind Core HIIT. By using our service, you agree to be bound by these terms.
          </p>
          <div className="mt-4 inline-flex items-center text-sm font-medium text-muted-foreground bg-muted/50 px-4 py-2 rounded-full">
            Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
        </motion.div>

        <div className="space-y-8">
          {/* Medical Disclaimer - Most Critical */}
          <Section icon={AlertTriangle} title="Medical Disclaimer" delay={0.1} isWarning={true}>
            <p className="font-semibold text-foreground mb-2">
              Mind Core HIIT is not a medical organization.
            </p>
            <p className="mb-4">
              The workouts, exercises, and information provided by this application are for educational and entertainment purposes only. They are not intended to be a substitute for professional medical advice, diagnosis, or treatment.
            </p>
            <p>
              Always consult with your physician or qualified healthcare provider before starting any new fitness program. By using this app, you acknowledge that you are voluntarily participating in these activities and assume all risk of injury to yourself.
            </p>
          </Section>

          {/* 1. Acceptance */}
          <Section icon={CheckCircle} title="1. Acceptance of Terms" delay={0.2}>
            <p>
              By accessing or using the Mind Core HIIT application ("Service"), you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the Service.
            </p>
          </Section>

          {/* 2. User Accounts */}
          <Section icon={User} title="2. User Accounts" delay={0.3}>
            <p className="mb-4">
              When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account.
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>You are responsible for safeguarding the password or authentication method that you use to access the Service.</li>
              <li>You agree not to disclose your password to any third party.</li>
              <li>You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.</li>
            </ul>
          </Section>

          {/* 3. Acceptable Use */}
          <Section icon={Gavel} title="3. Acceptable Use & Conduct" delay={0.4}>
            <p className="mb-4">You agree not to use the Service:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>In any way that violates any applicable national or international law or regulation.</li>
              <li>To transmit, or procure the sending of, any advertising or promotional material, including any "junk mail", "chain letter," "spam," or any other similar solicitation.</li>
              <li>To impersonate or attempt to impersonate the Company, a Company employee, another user, or any other person or entity.</li>
              <li>To engage in any other conduct that restricts or inhibits anyone's use or enjoyment of the Service, or which, as determined by us, may harm the Company or users of the Service or expose them to liability.</li>
            </ul>
          </Section>

          {/* 4. Intellectual Property */}
          <Section icon={FileText} title="4. Intellectual Property Rights" delay={0.5}>
            <p>
              The Service and its original content (excluding Content provided by users), features, and functionality are and will remain the exclusive property of Mind Core HIIT and its licensors. The Service is protected by copyright, trademark, and other laws of both the United States and foreign countries. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of Mind Core HIIT.
            </p>
          </Section>

          {/* 5. Limitation of Liability */}
          <Section icon={AlertOctagon} title="5. Limitation of Liability" delay={0.6}>
            <p>
              In no event shall Mind Core HIIT, its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li>Your access to or use of or inability to access or use the Service;</li>
              <li>Any conduct or content of any third party on the Service;</li>
              <li>Any content obtained from the Service; and</li>
              <li>Unauthorized access, use or alteration of your transmissions or content.</li>
            </ul>
          </Section>

          {/* 6. Disclaimer */}
          <Section icon={Info} title="6. Disclaimer of Warranties" delay={0.7}>
            <p>
              Your use of the Service is at your sole risk. The Service is provided on an "AS IS" and "AS AVAILABLE" basis. The Service is provided without warranties of any kind, whether express or implied, including, but not limited to, implied warranties of merchantability, fitness for a particular purpose, non-infringement or course of performance.
            </p>
          </Section>

          {/* 7. Privacy */}
          <Section icon={Shield} title="7. User Data & Privacy" delay={0.8}>
            <p>
              We respect your privacy and handle your data in accordance with our Privacy Policy. By using the Service, you consent to the collection and use of information as detailed in our <a href="/privacy" className="text-primary font-bold hover:underline">Privacy Policy</a>.
            </p>
          </Section>

          {/* 8. Modifications */}
          <Section icon={FileText} title="8. Modifications to Terms" delay={0.9}>
            <p>
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will try to provide at least 30 days notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
            </p>
          </Section>

          {/* Contact */}
          <Section icon={Mail} title="Contact Us" delay={1.0}>
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <p className="mb-2">
                  If you have any questions about these Terms, please contact us:
                </p>
                <a href="mailto:ross@mindcorehiitgenerator.com" className="text-primary font-bold hover:underline text-lg">
                  ross@mindcorehiitgenerator.com
                </a>
              </div>
              <Button onClick={() => window.location.href = 'mailto:ross@mindcorehiitgenerator.com'}>
                Contact Support
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

export default TermsOfService;
