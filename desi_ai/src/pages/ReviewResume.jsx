import { FileText, Sparkles } from "lucide-react";
import React, { useState } from "react";
import axios from "axios";

const ReviewResume = () => {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const vite_url = "https://desi-ai-server1.onrender.com"

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    if (!file) {
      alert("Please upload a resume first.");
      return;
    }

    try {
      setLoading(true);
      setResult("");

      const formData = new FormData();
      formData.append("resume", file); // MUST match backend key

      const { data } = await axios.post(
        "${vite_url}/api/ai/resume-review",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          withCredentials: true, // important for auth
        },
      );

      if (data.success) {
        setResult(data.content);
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Resume Review Error:", error);
      alert("Failed to review resume.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="h-full overflow-y-scroll p-6 flex flex-wrap gap-4 text-slate-700"
      style={{ maxWidth: 1200 }}
    >
      {/* LEFT COLUMN */}
      <form
        onSubmit={onSubmitHandler}
        className="w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200"
      >
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 text-[#00DA83]" />
          <h1 className="text-xl font-semibold">Resume Review</h1>
        </div>

        <p className="mt-6 text-sm font-medium">Upload Resume</p>

        <input
          onChange={(e) => setFile(e.target.files[0])}
          accept="application/pdf"
          type="file"
          className="w-full p-2 px-3 mt-2 outline-none text-sm rounded-md border border-gray-300 text-gray-600"
          required
        />

        <p className="text-xs text-gray-500 font-light">
          Supports PDF resume only.
        </p>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-[#00DA83] to-[#009BB3] text-white px-4 py-2 mt-6 text-sm rounded-lg cursor-pointer disabled:opacity-60"
        >
          <FileText className="w-5" />
          {loading ? "Reviewing..." : "Review Resume"}
        </button>
      </form>

      {/* RIGHT COLUMN */}
      <div className="w-full max-w-lg p-4 bg-white rounded-lg flex flex-col border border-gray-200 min-h-96 max-h-[600px] overflow-y-auto">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-[#00DA83]" />
          <h1 className="text-xl font-semibold">Analysis Results</h1>
        </div>

        <div className="flex-1 mt-4 text-sm whitespace-pre-wrap">
          {loading && (
            <div className="text-gray-400 text-center mt-10">
              Analyzing resume...
            </div>
          )}

          {!loading && result && <div className="text-gray-700">{result}</div>}

          {!loading && !result && (
            <div className="text-sm flex flex-col items-center gap-5 text-gray-400 mt-10">
              <FileText className="w-9 h-9" />
              <p>Upload a Resume and CLICK "Review Resume" to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewResume;
