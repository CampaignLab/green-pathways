import React, {useEffect, useState} from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { Mic, Upload, HelpCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import Button from '../components/ui/Button';
import AudioRecorder from '../components/audio/AudioRecorder';
import AudioUploader from '../components/audio/AudioUploader';
import TextSubmission from '../components/text/TextSubmission';
import { AudioSubmission } from '../types';

const HomePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'record' | 'upload' | 'text'>('record');
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [postcode, setPostcode] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    sessionStorage.setItem("user_name", name);
    sessionStorage.setItem("user_postcode", postcode);
  }, [name, postcode]);

  const uploadToBackend = async (audioBlob: Blob, contentType: string) => {
    const submissionId = uuidv4();

    const submission: AudioSubmission = {
      id: submissionId,
      contentType,
      createdAt: new Date(),
      status: 'uploading'
    };
    
    sessionStorage.setItem(`submission_${submissionId}`, JSON.stringify(submission));
    (window as any).submissionBlob = audioBlob;
    
    return submissionId;
  };
  
  const handleRecordingComplete = async (recording: Blob) => {
    setError(null);
    
    try {
      // Upload the recording to the backend
      const submissionId = await uploadToBackend(recording, recording.type || "audio/webm");
      
      // Navigate to the processing page
      navigate(`/processing/${submissionId}`);
    } catch (error) {
      console.error('Error processing recording:', error);
      setError('Failed to upload recording. Please try again.');
    }
  };

const extensionToContentType = (extension: string) => {
  switch (extension.toLowerCase()) {
    case "m4a": return "audio/mp4"; // m4a is a subset of mp4
    case "mp3": return "audio/mpeg";
    case "wav": return "audio/wav";
    case "ogg": return "audio/ogg";
    case "webm": return "audio/webm";
    case "aac": return "audio/aac";
    case "flac": return "audio/flac";
    default: return "application/octet-stream"; // fallback for unknown types
  }
};
  
  const handleFileUpload = async (file: File) => {
    setError(null);

    try {
      const pieces = file.name.split(".");
      const extension = pieces[pieces.length - 1];
      const contentType = extensionToContentType(extension);
      
      // Upload the file directly
      const submissionId = await uploadToBackend(file, contentType);
      
      // Navigate to the processing page
      navigate(`/processing/${submissionId}`);
    } catch (error) {
      console.error('Error processing file upload:', error);
      setError('Failed to upload file. Please try again.');
    }
  };

  const handleTextSubmit = (text: string) => {
    // Handle text submission similar to audio
    console.log('Text submitted:', text);
  };

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="bg-purple-900 text-white rounded-xl overflow-hidden shadow-xl animate-fadeIn">
        <div className="relative px-6 py-12 sm:px-12 sm:py-16">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900 to-purple-800 opacity-50"></div>
          <div className="relative max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
              Have Your Say on the UK's Pathways to Work Green Paper
            </h1>
            <p className="text-xl md:text-2xl opacity-90 mb-8 leading-relaxed">
              Your voice matters. The government's proposed changes to health and disability benefits could affect millions. Share your experience and help shape the future.
            </p>
          </div>
        </div>
      </section>

      {/* Submission Section */}
      <Card>
        <CardHeader>
          <CardTitle>Information about you</CardTitle>
          <CardDescription>We won't store your personal information.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-1">
              <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                Your Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 gap-1">
              <label htmlFor="postcode" className="block text-sm font-medium text-slate-700">
                Your Postcode
              </label>
              <input
                type="text"
                id="postcode"
                name="postcode"
                placeholder="e.g. SW1A 1AA"
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                onChange={(e) => setPostcode(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>How would you like to contribute?</CardTitle>
          <CardDescription>Choose the method that works best for you</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-6">
            <Button 
              variant={activeTab === 'record' ? 'primary' : 'outline'}
              onClick={() => setActiveTab('record')}
              icon={<Mic className="h-5 w-5" />}
            >
              Record Directly
            </Button>
            <Button 
              variant={activeTab === 'upload' ? 'primary' : 'outline'}
              onClick={() => setActiveTab('upload')}
              icon={<Upload className="h-5 w-5" />}
            >
              Upload Audio File
            </Button>
            {/* <Button 
              variant={activeTab === 'text' ? 'primary' : 'outline'}
              onClick={() => setActiveTab('text')}
              icon={<HelpCircle className="h-5 w-5" />}
            >
              Text Submission
            </Button> */}
          </div>
          
          {activeTab === 'record' && (
            <AudioRecorder onRecordingComplete={handleRecordingComplete} />
          )}
          
          {activeTab === 'upload' && (
            <AudioUploader onFileUpload={handleFileUpload} />
          )}
          
          {activeTab === 'text' && (
            <TextSubmission onSubmit={handleTextSubmit} />
          )}
        </CardContent>
      </Card>

      {/* Tips Section */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex gap-4">
        <div className="shrink-0">
          <HelpCircle className="h-6 w-6 text-purple-500" />
        </div>
        <div>
          <h3 className="font-medium text-purple-800 mb-1">Tips for a great submission</h3>
          <ul className="list-disc list-inside text-purple-700 space-y-1 text-sm">
            <li>Speak clearly and at a normal pace</li>
            <li>Share your personal experiences with the benefits system</li>
            <li>Explain how the proposed changes would affect you</li>
            <li>Mention any alternatives that you think would work better</li>
            <li>Recordings cannot be longer than 5 minutes</li>
          </ul>
        </div>
      </div>

      {/* Note: The following sections can be manually modified in the code */}
      {/* Important Questions to Consider: Lines 280-310 */}
      {/* How It Works: Lines 313-359 */}
      {/* Why Speaking Up Matters: Lines 362-386 */}
    </div>
  );
};

export default HomePage;