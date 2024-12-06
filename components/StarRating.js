import React, { useState, useEffect, useCallback } from "react";
import styles from "../styles/StarRating.module.css";

function getOrCreateUserId() {
  try {
    let id = localStorage.getItem("epdf_user_id");
    if (!id) {
      id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : "uid-" +
            Math.random().toString(36).slice(2) +
            Date.now().toString(36);
      localStorage.setItem("epdf_user_id", id);
    }
    return id;
  } catch {
    return null;
  }
}

const StarRating = ({ toolKey }) => {
  const [averageRating, setAverageRating] = useState(5);
  const [ratingCount, setRatingCount] = useState(3);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [hasRated, setHasRated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);

  useEffect(() => {
    try {
      const alreadyRated = localStorage.getItem(`rated_${toolKey}`);
      if (alreadyRated) setHasRated(true);
    } catch {
      // ignore
    }

    fetch("/api/get-ratings")
      .then((r) => r.json())
      .then((data) => {
        if (data.ratings && data.ratings[toolKey]) {
          setAverageRating(data.ratings[toolKey].averageRating);
          setRatingCount(data.ratings[toolKey].ratingCount);
        }
        setIsLoaded(true);
      })
      .catch(() => setIsLoaded(true));
  }, [toolKey]);

  const handleStarClick = useCallback(
    async (star) => {
      if (hasRated || isSubmitting) return;

      const userId = getOrCreateUserId();
      if (!userId) return;

      setIsSubmitting(true);
      try {
        const res = await fetch("/api/rate-tool", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ toolKey, rating: star, userId }),
        });
        const data = await res.json();
        if (res.ok) {
          setAverageRating(data.averageRating);
          setRatingCount(data.ratingCount);
          setHasRated(true);
          setShowThankYou(true);
          try {
            localStorage.setItem(`rated_${toolKey}`, star.toString());
          } catch {
            // ignore
          }
        }
      } catch {
        // network error — silently fail
      } finally {
        setIsSubmitting(false);
      }
    },
    [toolKey, hasRated, isSubmitting]
  );

  const displayRating = hoveredStar || Math.round(averageRating);

  if (!isLoaded) return null;

  return (
    <div
      className={styles.rating_wrapper}
      aria-label={`Рейтинг: ${averageRating} от 5`}
    >
      <div className={styles.stars_row}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`${styles.star} ${
              star <= displayRating ? styles.star_filled : styles.star_empty
            } ${hasRated ? styles.star_readonly : ""}`}
            onClick={() => handleStarClick(star)}
            onMouseEnter={() => !hasRated && setHoveredStar(star)}
            onMouseLeave={() => !hasRated && setHoveredStar(0)}
            aria-label={`Оцени с ${star} от 5 звезди`}
            disabled={hasRated || isSubmitting}
          >
            &#9733;
          </button>
        ))}
      </div>
      <div className={styles.rating_meta}>
        <span className={styles.rating_value}>{averageRating.toFixed(1)}</span>
        <span className={styles.rating_count}>({ratingCount} оценки)</span>
      </div>
      {showThankYou && (
        <p className={styles.thank_you}>Благодарим за оценката!</p>
      )}
      {!hasRated && !showThankYou && (
        <p className={styles.prompt}>Оцени този инструмент</p>
      )}
    </div>
  );
};

export default StarRating;
