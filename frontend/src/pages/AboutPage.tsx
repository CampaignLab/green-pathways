import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, AlertTriangle, Info, ExternalLink, Heart, Shield, Database, LightbulbIcon } from 'lucide-react';
import Button from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';

const AboutPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-slate-800">About the Green Paper</h1>
        <p className="text-lg text-slate-600 leading-relaxed">
          The UK government has published a Green Paper titled "Pathways to Work: Health and Disability," 
          proposing significant changes to the benefits system. This page explains what this means 
          and why your voice matters.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2 text-purple-600" />
              What is a Green Paper?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600">
              A Green Paper is a preliminary government report of proposals that is published to 
              stimulate discussion. It is part of a consultation process that gives people a chance 
              to give feedback before policies are finalized.
            </p>
            <p className="text-slate-600 mt-4">
              This consultation will directly influence future legislation that could affect millions 
              of people who receive health and disability benefits in the UK.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-amber-500" />
              Why This Matters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600">
              The proposals in this Green Paper could significantly change how health and disability 
              benefits work, including:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-slate-600">
              <li>Changes to assessment processes</li>
              <li>New requirements for benefit recipients</li>
              <li>Different levels of financial support</li>
              <li>Changes to support for finding and staying in work</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <LightbulbIcon className="h-5 w-5 mr-2 text-yellow-500" />
            Why Did We Build This?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600 leading-relaxed">
            As disabled individuals who are both working, we understand firsthand the challenges within the system. 
            Having experienced the difficulties in accessing support, particularly since childhood, we recognized 
            the need for change. Our understanding of political processes led us to identify Green Papers as a 
            crucial point of intervention.
          </p>
          <p className="text-slate-600 mt-4 leading-relaxed">
            We created this platform to provide a constructive way to engage with the system and enable others 
            to do the same. We believe that by making the consultation process more accessible, we can increase 
            participation and reduce the potential negative impact of this bill on people's lives.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2 text-purple-600" />
            Privacy and Trust Concerns
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600 mb-4">
            We understand the concerns about AI and data usage. Here's how we protect your privacy:
          </p>
          <ul className="space-y-4 text-slate-600">
            <li className="flex items-start">
              <span className="font-medium mr-2">1.</span>
              <p>We've invested in paid AI licensing to ensure your data isn't used for training purposes. 
              As disabled developers ourselves, we've prioritized privacy over profit.</p>
            </li>
            <li className="flex items-start">
              <span className="font-medium mr-2">2.</span>
              <p>Your content is temporary - we only store it in your browser session. Once you close your 
              browser or leave the site, everything you have done is discarded. Our goal is to support disabled people, 
              not to collect personal data. We are collecting some metadata, see next part.</p>
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="h-5 w-5 mr-2 text-purple-600" />
            What Data Do We Collect?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600 mb-4">
            We may (based on if we have time to develop this) collect the following limited data when functionality is implemented:
          </p>
          <ul className="space-y-3 text-slate-600">
            <li className="flex items-start">
              <span className="font-medium mr-2">1.</span>
              <p>A unique ID for each AI interaction to track total consultation responses</p>
            </li>
            <li className="flex items-start">
              <span className="font-medium mr-2">2.</span>
              <p>Submission timestamps to understand when people are engaging</p>
            </li>
            <li className="flex items-start">
              <span className="font-medium mr-2">3.</span>
              <p>Word count metrics (input and output) to monitor AI performance. Not the words you submitted, just a tool to count how many.</p>
            </li>
          </ul>
          <p className="text-slate-600 mt-4">
            While we won't share individual data, we hope to share aggregate insights about our collective 
            impact on the consultation process. Together, we can make a difference.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Key Proposals in the Green Paper</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <ProposalItem 
              title="Work Capability Assessments" 
              description="Proposals to reform or replace the current Work Capability Assessment system for determining fitness to work."
            />
            
            <ProposalItem 
              title="Financial Support Changes" 
              description="Potential changes to how financial support is structured and provided to those with health conditions and disabilities."
            />
            
            <ProposalItem 
              title="Employment Support" 
              description="New approaches to helping people find and stay in work, including possibly mandatory support programmes."
            />
            
            <ProposalItem 
              title="Healthcare Integration" 
              description="Closer integration between health services and employment support to better address health-related barriers to work."
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface ProposalItemProps {
  title: string;
  description: string;
}

const ProposalItem: React.FC<ProposalItemProps> = ({ title, description }) => {
  return (
    <div className="border-b border-slate-200 pb-4 last:border-0 last:pb-0">
      <h3 className="font-medium text-lg text-slate-800 mb-1">{title}</h3>
      <p className="text-slate-600">{description}</p>
    </div>
  );
};

export default AboutPage;