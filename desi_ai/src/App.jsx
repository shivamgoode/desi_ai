import React from "react";
import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Layout from "./pages/Layout";
import BlogTitles from "./pages/BlogTitles";
import Home from "./pages/Home";

import WriteArtice from "./pages/WriteArtice";
import GenerateImages from "./pages/GenerateImages";
import RemoveBackground from "./pages/RemoveBackground";
import RemoveObject from "./pages/RemoveObject";
import ReviewResume from "./pages/ReviewResume";
import Community from "./pages/Community";
import { useAuth } from "@clerk/clerk-react";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";

const App = () => {
  const { getToken } = useAuth();
  useEffect(() => {
    getToken().then((token) => console.log("Token:", token));
  }, []);
  return (
    <div>
      <Toaster />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/ai" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="write-article" element={<WriteArtice />} />
          <Route path="generate-images" element={<GenerateImages />} />
          <Route path="remove-background" element={<RemoveBackground />} />
          <Route path="remove-object" element={<RemoveObject />} />
          <Route path="review-resume" element={<ReviewResume />} />
          <Route path="community" element={<Community />} />
          <Route path="blog-titles" element={<BlogTitles />} />
        </Route>
      </Routes>
    </div>
  );
};

export default App;
