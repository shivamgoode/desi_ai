import Groq from "groq-sdk";
import sql from "../configs/db.js";
import { clerkClient } from "@clerk/express";
import axios from "axios";
import { v2 as cloudinary } from "cloudinary";
import FormData from "form-data";
import fs from "fs";
import pdf from "pdf-parse";

// ✅ Initialize Groq
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/* ===========================================================
   ✍️ GENERATE ARTICLE
=========================================================== */
export const generateArticle = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { prompt, length } = req.body;
    const plan = req.plan;
    const free_usage = req.free_usage;

    if (!prompt || !length) {
      return res.status(400).json({
        success: false,
        message: "Prompt and length are required.",
      });
    }

    if (plan !== "premium" && free_usage >= 10) {
      return res.status(403).json({
        success: false,
        message: "Limit reached. Upgrade to continue.",
      });
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "user",
          content: `${prompt}\n\nWrite approximately ${length} words.`,
        },
      ],
      temperature: 0.7,
      max_tokens: Number(length),
    });

    const content =
      completion.choices?.[0]?.message?.content || "No content generated.";

    await sql`
      INSERT INTO creations (user_id, prompt, content, type)
      VALUES (${userId}, ${prompt}, ${content}, 'article')
    `;

    if (plan !== "premium") {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: { free_usage: free_usage + 1 },
      });
    }

    return res.json({ success: true, content });
  } catch (error) {
    console.error("Generate Article Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while generating article.",
    });
  }
};

/* ===========================================================
   📝 GENERATE BLOG TITLE
=========================================================== */
export const generateBlogTitle = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { prompt } = req.body;
    const plan = req.plan;
    const free_usage = req.free_usage;

    if (plan !== "premium" && free_usage >= 10) {
      return res.json({
        success: false,
        message: "Limit reached. Upgrade to continue.",
      });
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "user",
          content: `Generate 5 catchy blog titles for: ${prompt}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    const content =
      completion.choices?.[0]?.message?.content || "No titles generated.";

    await sql`
      INSERT INTO creations (user_id, prompt, content, type)
      VALUES (${userId}, ${prompt}, ${content}, 'blog-title')
    `;

    if (plan !== "premium") {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: { free_usage: free_usage + 1 },
      });
    }

    res.json({ success: true, content });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ===========================================================
   🖼 GENERATE IMAGE (Premium Only)
=========================================================== */
export const generateImage = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { prompt, publish } = req.body;
    const plan = req.plan;

    if (plan !== "premium") {
      return res.json({
        success: false,
        message: "Premium plan required.",
      });
    }

    const formData = new FormData();
    formData.append("prompt", prompt);

    const { data } = await axios.post(
      "https://clipdrop-api.co/text-to-image/v1",
      formData,
      {
        headers: { "x-api-key": process.env.CLIPDROP_API_KEY },
        responseType: "arraybuffer",
      },
    );

    const base64Image = `data:image/png;base64,${Buffer.from(
      data,
      "binary",
    ).toString("base64")}`;

    const { secure_url } = await cloudinary.uploader.upload(base64Image);

    await sql`
      INSERT INTO creations (user_id, prompt, content, type, publish)
      VALUES (${userId}, ${prompt}, ${secure_url}, 'image', ${publish ?? false})
    `;

    res.json({ success: true, content: secure_url });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ===========================================================
   🎯 REMOVE IMAGE BACKGROUND (Premium)
=========================================================== */
export const removeImageBackground = async (req, res) => {
  try {
    const { userId } = req.auth();
    const image = req.file;
    const plan = req.plan;

    if (plan !== "premium") {
      return res.json({
        success: false,
        message: "Premium plan required.",
      });
    }

    const { secure_url } = await cloudinary.uploader.upload(image.path, {
      transformation: [{ effect: "background_removal" }],
    });

    await sql`
      INSERT INTO creations (user_id, prompt, content, type)
      VALUES (${userId}, 'Remove background', ${secure_url}, 'image')
    `;

    res.json({ success: true, content: secure_url });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ===========================================================
   ✂️ REMOVE OBJECT FROM IMAGE (Premium)
=========================================================== */
export const removeImageObject = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { object } = req.body;
    const image = req.file;
    const plan = req.plan;

    if (plan !== "premium") {
      return res.json({
        success: false,
        message: "Premium plan required.",
      });
    }

    const { public_id } = await cloudinary.uploader.upload(image.path);

    const imageUrl = cloudinary.url(public_id, {
      transformation: [{ effect: `gen_remove:${object}` }],
    });

    await sql`
      INSERT INTO creations (user_id, prompt, content, type)
      VALUES (${userId}, ${`Remove ${object}`}, ${imageUrl}, 'image')
    `;

    res.json({ success: true, content: imageUrl });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ===========================================================
   📄 RESUME REVIEW (Groq)
=========================================================== */
export const resumeReview = async (req, res) => {
  try {
    const { userId } = req.auth();
    const resume = req.file;
    const plan = req.plan;

    if (plan !== "premium") {
      return res.json({
        success: false,
        message: "Premium plan required.",
      });
    }

    if (!resume) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded.",
      });
    }

    if (resume.size > 5 * 1024 * 1024) {
      return res.json({
        success: false,
        message: "File exceeds 5MB limit.",
      });
    }

    const dataBuffer = fs.readFileSync(resume.path);
    const pdfData = await pdf(dataBuffer);

    if (!pdfData.text || pdfData.text.trim().length === 0) {
      return res.json({
        success: false,
        message: "Unable to extract text from PDF.",
      });
    }

    // 🔥 Limit resume text to avoid token overflow
    const trimmedResume = pdfData.text.slice(0, 6000);

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant", // Updated model
      messages: [
        {
          role: "system",
          content:
            "You are a professional HR expert and resume reviewer. Provide structured, detailed, and constructive feedback.",
        },
        {
          role: "user",
          content: `
Review the following resume and provide:

1. Overall impression
2. Strengths
3. Weaknesses
4. Suggestions for improvement
5. Formatting advice

Resume:
${trimmedResume}
          `,
        },
      ],
      temperature: 0.6,
      max_tokens: 1200,
    });

    const content =
      completion.choices?.[0]?.message?.content || "No feedback generated.";

    await sql`
      INSERT INTO creations (user_id, prompt, content, type)
      VALUES (${userId}, 'Resume Review', ${content}, 'resume-review')
    `;

    res.json({ success: true, content });
  } catch (error) {
    console.error(
      "Resume Review Error:",
      error.response?.data || error.message,
    );
    res.status(500).json({
      success: false,
      message: "Failed to review resume.",
    });
  }
};

export default {
  generateArticle,
  generateBlogTitle,
  generateImage,
  removeImageBackground,
  removeImageObject,
  resumeReview,
};
