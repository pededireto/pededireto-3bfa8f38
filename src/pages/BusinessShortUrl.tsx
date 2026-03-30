import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

/**
 * /p/:slug → redirect 301-style to /negocio/:slug
 * Short URL for sharing businesses on WhatsApp, social, etc.
 */
const BusinessShortUrl = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (slug) {
      navigate(`/negocio/${slug}`, { replace: true });
    } else {
      navigate("/", { replace: true });
    }
  }, [slug, navigate]);

  return null;
};

export default BusinessShortUrl;
