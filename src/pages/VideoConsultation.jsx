import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const normalizeMeetLink = (value) => {
  const input = value.trim();
  if (!input) return "";

  if (input.startsWith("http://") || input.startsWith("https://")) {
    return input;
  }

  const cleaned = input.replace(/\s+/g, "");

  if (cleaned.includes("meet.google.com/")) {
    return cleaned.startsWith("http")
      ? cleaned
      : `https://${cleaned.replace(/^\/+/, "")}`;
  }

  // Treat short input as a Google Meet code like abc-defg-hij.
  return `https://meet.google.com/${cleaned}`;
};

const VideoConsultation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const doctor = location.state?.doctor;
  const [meetInput, setMeetInput] = useState("");
  const [error, setError] = useState("");
  const [copyStatus, setCopyStatus] = useState("");

  const suggestedMeetLink = useMemo(
    () => `Paste doctor's Google Meet link or code here`,
    []
  );

  const openMeet = (url) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (!doctor) {
    return (
      <div className="mx-auto mt-10 max-w-xl rounded-2xl bg-white p-6 text-center shadow-lg">
        <p className="mb-4 text-gray-600">
          No doctor selected. Please go to the{" "}
          <span
            onClick={() => navigate("/doctors")}
            className="cursor-pointer text-blue-600 underline"
          >
            Doctors
          </span>{" "}
          page first.
        </p>
      </div>
    );
  }

  const handleJoinMeet = () => {
    const normalized = normalizeMeetLink(meetInput);
    if (!normalized) {
      setError("Please enter a valid Google Meet link or meeting code.");
      return;
    }
    setError("");
    openMeet(normalized);
  };

  const handleCopyInvite = async () => {
    const message = `Hello ${doctor.name},\n\nI am ready for our video consultation. Please start the Google Meet call and share the meeting link with me.\n\nThank you.`;
    try {
      await navigator.clipboard.writeText(message);
      setCopyStatus("Invite copied.");
    } catch (copyError) {
      setCopyStatus("Copy failed. Please copy manually.");
    }
  };

  const handleEmailInvite = () => {
    const subject = encodeURIComponent("Video Consultation Request");
    const body = encodeURIComponent(
      `Hello ${doctor.name},\n\nI am ready for our video consultation. Please start the Google Meet call and share the meeting link with me.\n\nThank you.`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <div className="mx-auto mt-6 max-w-xl rounded-2xl bg-white p-4 shadow-lg sm:mt-10 sm:p-6">
      <h2 className="mb-4 text-center text-xl font-bold text-blue-800 sm:text-2xl">
        Video Consultation
      </h2>

      <div className="rounded-xl bg-blue-50 p-4 text-center shadow-inner sm:p-6">
        <p className="mb-2 text-gray-700">You are consulting with:</p>
        <p className="text-xl font-bold text-blue-700">{doctor.name}</p>
        <p className="mb-4 text-gray-600">{doctor.specialty}</p>

        <p className="mb-2 text-sm font-semibold text-gray-700">
          Ask doctor to start the call
        </p>
        <p className="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
          The doctor should start the Google Meet session and share the link with
          you.
        </p>

        <div className="mt-6 border-t border-blue-100 pt-4 text-left">
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Join with doctor's Meet link or code
          </label>
          <input
            type="text"
            value={meetInput}
            onChange={(event) => setMeetInput(event.target.value)}
            placeholder="e.g. https://meet.google.com/abc-defg-hij or abc-defg-hij"
            className="mb-3 w-full rounded-lg border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
          <button
            onClick={handleJoinMeet}
            className="w-full rounded-xl bg-blue-700 py-3 font-semibold text-white hover:bg-blue-800"
          >
            Join Google Meet
          </button>
        </div>

        <p className="mt-4 break-all text-xs text-gray-500">
          Tip: {suggestedMeetLink}
        </p>

        <div className="mt-4 rounded-lg bg-white p-3 text-left">
          <p className="mb-2 text-xs font-semibold text-gray-700">
            Consultation invite message
          </p>
          <p className="mb-3 whitespace-pre-line break-all text-xs text-gray-600">
            {`Hello ${doctor.name},\n\nI am ready for our video consultation. Please start the Google Meet call and share the meeting link with me.\n\nThank you.`}
          </p>
          <button
            onClick={handleCopyInvite}
            className="w-full rounded-lg bg-slate-700 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Copy Invite Message
          </button>
          <button
            onClick={handleEmailInvite}
            className="mt-2 w-full rounded-lg bg-blue-700 py-2 text-sm font-semibold text-white hover:bg-blue-800"
          >
            Send via Email
          </button>
          {copyStatus && <p className="mt-2 text-xs text-green-700">{copyStatus}</p>}
        </div>
      </div>
    </div>
  );
};

export default VideoConsultation;
