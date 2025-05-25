import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, CheckCircle, AlertTriangle, RefreshCw } from "lucide-react";
import { Card, CardContent } from "../components/ui/Card";
import {AudioSubmission, Email, ProcessingStep, processingSteps} from "../types";
import Button from "../components/ui/Button";

const backendUrl =
  import.meta.env.MODE === "development"
    ? "/api"
    : import.meta.env.VITE_BACKEND_URL;

const ProcessingPage: React.FC = () => {
  const { submissionId } = useParams<{ submissionId: string }>();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] =
    useState<ProcessingStep>("transcribing");
  const [progress, setProgress] = useState<number>(0);
  const [submission, setSubmission] = useState<AudioSubmission | null>(null);
  const [error, setError] = useState<string | null>(null);

  const transcribeAudio = useCallback(
    async (audioBlob: Blob, contentType: string) => {
      const response = await fetch(`${backendUrl}/transcribe`, {
        method: "POST",
        body: audioBlob,
        headers: {
          "Content-Type": contentType,
        },
      });

      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.statusText}`);
      }
      const data = await response.text();
      return data;
    },
    []
  );

  const findEmail = useCallback(async (postcode: string | undefined) => {
    if (!postcode) {
      return undefined;
    }
    const response = await fetch(`${backendUrl}/email?postcode=${encodeURIComponent(postcode ?? '')}`, {
      method: "GET",
    });
    if (!response.ok) {
      throw new Error(`Email lookup failed: ${response.statusText}`);
    }
    return response.text();
  }, [])

  const writeSummary = useCallback(async (body: string, path: string) => {
    const response = await fetch(`${backendUrl}/${path}`, {
      method: "POST",
      body,
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error(`Transcription failed: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  }, []);

  useEffect(() => {
    // Check if we have the submission in sessionStorage
    const storedSubmission = sessionStorage.getItem(
      `submission_${submissionId}`
    );
    if (!storedSubmission) {
      setError("Submission not found. Please try recording again.");
      setCurrentStep("error");
      return;
    }

    // Get the recording blob from window object
    const recordingBlob = (window as any).submissionBlob;
    if (!recordingBlob) {
      setError("Recording not found. Please try recording again.");
      setCurrentStep("error");
      return;
    }

    // Parse the stored submission and add the recording back
    const parsedSubmission: AudioSubmission = JSON.parse(storedSubmission);
    parsedSubmission.recording = recordingBlob;
    parsedSubmission.name = sessionStorage.getItem("user_name") ?? undefined;
    parsedSubmission.postcode = sessionStorage.getItem("user_postcode") ?? undefined;
    setSubmission(parsedSubmission);

    // Start the processing pipeline
    processSubmission(parsedSubmission);
  }, [submissionId]);

  const processSubmission = async (sub: AudioSubmission) => {
    try {
      // Step 1: Transcribe audio
      setCurrentStep("transcribing");
      setProgress(10);
      const [transcript, emailAddress] = await Promise.all([transcribeAudio(
        sub.recording as Blob,
        sub.contentType
      ), findEmail(sub.postcode)]);
      sub.transcript = transcript;
      sub.mpEmailAddress = emailAddress;
      updateSubmission(sub);
      setProgress(30);

      // Step 2: Prepare submissions
      setCurrentStep("preparing");
      const greenpaperBody = JSON.stringify({ transcript, name: sub.name })
      const mpEmailBody = JSON.stringify({ transcript, name: sub.name, mp_name: sub.mpName, postcode: sub.postcode })
      const [greenpaper, mpemail] = await Promise.all([
        writeSummary(greenpaperBody, "greenpaper"),
        writeSummary(mpEmailBody, "mpemail"),
      ]);
      console.log("greenpaper", greenpaper);
      console.log("mpemail", mpemail);
      sub.greenpaper = greenpaper as Email;
      sub.mp = mpemail as Email;
      updateSubmission(sub);

      // Processing complete
      setCurrentStep("complete");
      setProgress(100);

      // Automatically navigate to the submission page after a short delay
      setTimeout(() => {
        navigate(`/submission/${submissionId}`);
      }, 1500);
    } catch (err) {
      console.error("Error processing submission:", err);
      setError(
        "An error occurred while processing your submission. Please try again."
      );
      setCurrentStep("error");
    }
  };

  const updateSubmission = (updatedSubmission: AudioSubmission) => {
    setSubmission(updatedSubmission);

    // Update in sessionStorage (without the blob)
    const storageVersion = {
      ...updatedSubmission,
      recording: null,
    };
    sessionStorage.setItem(
      `submission_${submissionId}`,
      JSON.stringify(storageVersion)
    );
  };

  const retryProcessing = () => {
    if (submission) {
      processSubmission(submission);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-slate-800">
          Processing Your Submission
        </h1>
        <p className="text-lg text-slate-600">
          We're turning your audio recording into structured responses. This may
          take a moment.
        </p>
      </div>

      <Card>
        <CardContent className="p-8">
          <div className="space-y-8">
            <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ease-out ${
                  currentStep === "error" ? "bg-red-500" : "bg-blue-600"
                }`}
                style={{ width: `${progress}%` }}
              ></div>
            </div>

            <div className="space-y-6">
              <ProcessingStepItem
                title="Transcribing your audio"
                status={getStepStatus("transcribing", currentStep)}
                icon={<Loader2 className="h-6 w-6 animate-spin" />}
                completedIcon={
                  <CheckCircle className="h-6 w-6 text-green-500" />
                }
              />

              <ProcessingStepItem
                title="Preparing submissions"
                status={getStepStatus("preparing", currentStep)}
                icon={<Loader2 className="h-6 w-6 animate-spin" />}
                completedIcon={
                  <CheckCircle className="h-6 w-6 text-green-500" />
                }
              />
            </div>

            {currentStep === "error" && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <AlertTriangle className="h-6 w-6 text-red-500 mr-3" />
                  <div>
                    <h3 className="text-red-800 font-medium">
                      Processing Error
                    </h3>
                    <p className="text-red-700 mt-1">
                      {error || "An unexpected error occurred."}
                    </p>
                    <Button
                      variant="primary"
                      className="mt-4"
                      icon={<RefreshCw className="h-4 w-4" />}
                      onClick={retryProcessing}
                    >
                      Try Again
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {currentStep === "completed" && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4 text-center animate-fadeIn">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <h3 className="text-green-800 font-medium text-lg">
                  Processing Complete!
                </h3>
                <p className="text-green-700 mt-1">
                  Your submission has been successfully processed. Redirecting
                  you to your results...
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="text-center text-sm text-slate-500">
        Note: Your data is processed locally and not stored on any external
        servers.
      </div>
    </div>
  );
};

interface ProcessingStepItemProps {
  title: string;
  status: "waiting" | "in-progress" | "completed";
  icon: React.ReactNode;
  completedIcon: React.ReactNode;
}

const ProcessingStepItem: React.FC<ProcessingStepItemProps> = ({
  title,
  status,
  icon,
  completedIcon,
}) => {
  return (
    <div className="flex items-center">
      <div className="mr-4">
        {status === "completed" ? (
          completedIcon
        ) : status === "in-progress" ? (
          icon
        ) : (
          <div className="h-6 w-6 rounded-full border-2 border-slate-300"></div>
        )}
      </div>
      <span
        className={`
        font-medium
        ${status === "waiting" ? "text-slate-400" : ""}
        ${status === "in-progress" ? "text-blue-700" : ""}
        ${status === "completed" ? "text-slate-800" : ""}
      `}
      >
        {title}
      </span>
    </div>
  );
};

function getStepStatus(
  step: ProcessingStep,
  currentStep: ProcessingStep
): "waiting" | "in-progress" | "completed" {
  const stepIndex = processingSteps.indexOf(step);
  const currentIndex = processingSteps.indexOf(currentStep);

  if (stepIndex < currentIndex) {
    return "completed";
  } else if (stepIndex === currentIndex) {
    return "in-progress";
  } else {
    return "waiting";
  }
}

export default ProcessingPage;
