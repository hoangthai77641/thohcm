import React, { useState } from 'react'

export function ServiceMediaGallery({ images = [], videos = [] }) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const allMedia = [
    ...images.map(img => ({ type: 'image', url: img })),
    ...videos.map(vid => ({ type: 'video', url: vid }))
  ]

  if (allMedia.length === 0) {
    return (
      <div className="service-media-placeholder">
        <div className="placeholder-icon">📷</div>
        <span>Chưa có hình ảnh</span>
      </div>
    )
  }

  const currentMedia = allMedia[selectedIndex]

  const getMediaUrl = (url) => {
    // If URL is already a full URL (starts with http/https), use it directly
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    // Otherwise, it's a local file path, prepend server URL
    return `http://localhost:3001${url}`;
  };

  const getVideoEmbedUrl = (url) => {
    // Convert YouTube URLs to embed format
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    // For other video URLs, try to use them directly
    return getMediaUrl(url);
  };

  const isExternalVideo = (url) => {
    return url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com');
  };

  return (
    <>
      <div className="service-media-gallery">
        <div className="media-main" onClick={() => setIsModalOpen(true)}>
          {currentMedia.type === 'image' ? (
            <img
              src={getMediaUrl(currentMedia.url)}
              alt="Service"
              className="media-image"
            />
          ) : (
            <div className="media-video-thumb">
              {isExternalVideo(currentMedia.url) ? (
                <iframe
                  src={getVideoEmbedUrl(currentMedia.url)}
                  className="media-video-iframe"
                  allowFullScreen
                  title="Video"
                />
              ) : (
                <>
                  <video
                    src={getMediaUrl(currentMedia.url)}
                    className="media-video"
                    muted
                  />
                  <div className="video-play-overlay">
                    <div className="play-button">▶</div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        
        {allMedia.length > 1 && (
          <div className="media-thumbnails">
            {allMedia.map((media, index) => (
              <div
                key={index}
                className={`thumbnail ${index === selectedIndex ? 'active' : ''}`}
                onClick={() => setSelectedIndex(index)}
              >
                {media.type === 'image' ? (
                  <img
                    src={getMediaUrl(media.url)}
                    alt={`Thumbnail ${index + 1}`}
                  />
                ) : (
                  <div className="video-thumbnail">
                    {isExternalVideo(media.url) ? (
                      <div className="external-video-thumb">
                        <div className="video-icon">🎥</div>
                        <span>Video</span>
                      </div>
                    ) : (
                      <>
                        <video
                          src={getMediaUrl(media.url)}
                          muted
                        />
                        <div className="video-icon">🎥</div>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        <div className="media-count">
          {images.length > 0 && <span>{images.length} ảnh</span>}
          {videos.length > 0 && <span>{videos.length} video</span>}
        </div>
      </div>

      {/* Modal for full-screen view */}
      {isModalOpen && (
        <div className="media-modal" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setIsModalOpen(false)}
            >
              ✕
            </button>
            
            <div className="modal-media">
              {currentMedia.type === 'image' ? (
                <img
                  src={getMediaUrl(currentMedia.url)}
                  alt="Service"
                />
              ) : (
                isExternalVideo(currentMedia.url) ? (
                  <iframe
                    src={getVideoEmbedUrl(currentMedia.url)}
                    className="modal-video-iframe"
                    allowFullScreen
                    title="Video"
                  />
                ) : (
                  <video
                    src={getMediaUrl(currentMedia.url)}
                    controls
                    autoPlay
                  />
                )
              )}
            </div>
            
            {allMedia.length > 1 && (
              <div className="modal-nav">
                <button
                  className="nav-btn prev"
                  onClick={() => setSelectedIndex(prev => 
                    prev === 0 ? allMedia.length - 1 : prev - 1
                  )}
                >
                  ◀
                </button>
                <span className="nav-counter">
                  {selectedIndex + 1} / {allMedia.length}
                </span>
                <button
                  className="nav-btn next"
                  onClick={() => setSelectedIndex(prev => 
                    prev === allMedia.length - 1 ? 0 : prev + 1
                  )}
                >
                  ▶
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}