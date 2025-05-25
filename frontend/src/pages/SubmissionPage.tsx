import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Copy,
  CheckCheck,
  Send,
  FileText,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "../components/ui/Card";
import Button from "../components/ui/Button";
import { AudioSubmission } from "../types";

const SubmissionPage: React.FC = () => {
  const { submissionId } = useParams<{ submissionId: string }>();
  const [submission, setSubmission] = useState<AudioSubmission | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Retrieve the submission from sessionStorage
    const storedSubmission = sessionStorage.getItem(
      `submission_${submissionId}`
    );
    if (!storedSubmission) {
      setError("Submission not found. Please try recording again.");
      return;
    }

    try {
      const parsedSubmission = JSON.parse(storedSubmission) as AudioSubmission;
      setSubmission(parsedSubmission);
    } catch (err) {
      console.error("Error loading submission:", err);
      setError("Error loading your submission. Please try recording again.");
    }
  }, [submissionId]);

  if (error) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-6 w-6 text-red-500 mr-3" />
            <div>
              <h3 className="text-red-800 font-medium">Error</h3>
              <p className="text-red-700 mt-1">{error}</p>
              <Link to="/record">
                <Button variant="primary" className="mt-4">
                  Try Again
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="max-w-3xl mx-auto text-center p-8">
        <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-slate-600">Loading your submission...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-slate-800">Your Response</h1>
        <p className="text-lg text-slate-600">
          We've processed your recording and formatted it into a response
          suitable for the official consultation.
        </p>
      </div>

      { submission.mp?.body && submission.mp.subject && (
      <SummaryCard
        title="Your Email to your MP"
        description="This is an email you can send to your MP"
        summary={submission.mp.body}
        buttonText="Write your MP"
        emailSubject={submission.mp.subject}
        emailUrl={submission.mpEmailAddress}
      />)}

      { submission.greenpaper?.body && submission.greenpaper.subject && (
      <SummaryCard
        title="Your Greenpaper Response"
        description="This is your response formatted for submission to the government consultation"
        summary={submission.greenpaper.body}
        buttonText="Email Response to the Consultation"
        emailUrl="consultation.pathwaystowork@dwp.gov.uk"
        emailSubject={submission.greenpaper.subject}
      />)}

      <Card>
        <CardHeader>
          <CardTitle>Original Transcript</CardTitle>
          <CardDescription>
            This is what we transcribed from your audio recording
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
            {submission.transcript}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row items-center justify-between bg-blue-50 border border-blue-100 rounded-lg p-6">
        <div className="flex items-center mb-4 sm:mb-0">
          <FileText className="h-10 w-10 text-blue-600 mr-4" />
          <div>
            <h3 className="text-lg font-medium text-blue-800">
              Need to record again?
            </h3>
            <p className="text-blue-700">
              You can make another recording at any time.
            </p>
          </div>
        </div>
        <Link to="/">
          <Button
            variant="outline"
            className="border-blue-300 text-blue-700 hover:bg-blue-100"
          >
            Make New Recording
          </Button>
        </Link>
      </div>
    </div>
  );
};

const SummaryCard = ({
  title,
  description,
  summary,
  buttonText,
  emailSubject,
  emailUrl,
}: {
  title: string;
  description: string;
  summary?: string;
  buttonText: string;
  emailSubject: string;
  emailUrl?: string;
}) => {
  const [copied, setCopied] = useState(false);

  const mailto = `mailto:${emailUrl}?subject=${emailSubject}`;

  if (!summary) {
    return <div />;
  }


  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);

      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description} </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-slate-50 p-4 rounded-md border border-slate-200 whitespace-pre-line">
          {summary}
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          onClick={copyToClipboard}
          icon={
            copied ? (
              <CheckCheck className="h-5 w-5" />
            ) : (
              <Copy className="h-5 w-5" />
            )
          }
        >
          {copied ? "Copied!" : "Copy to Clipboard"}
        </Button>

        <Button
          variant="primary"
          icon={<Send className="h-5 w-5" />}
          onClick={() => window.open(mailto, "_blank")}
        >
          {buttonText}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SubmissionPage;
