import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import YouTube from "react-youtube";
import { useRef } from "react";
import "../css/RoomPage.css";
import socket from "../socket";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function RoomPage() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const hostPlayerRef = useRef(null);
  const viewerPlayerRef = useRef(null);

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [savingVideo, setSavingVideo] = useState(false);
  const [notice, setNotice] = useState("");
  const [activePanel, setActivePanel] = useState("participants");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [copied, setCopied] = useState(false);
  const [announcementInput, setAnnouncementInput] = useState("");
  const [announcements, setAnnouncements] = useState([]);

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();

  const userId = String(user._id || user.id || user.userId || "");
  const hostId = String(room?.hostId?._id || room?.hostId || "");
  const isHost = Boolean(userId && hostId && userId === hostId);
  const participants = Array.isArray(room?.participants)
    ? room.participants
    : [];
  const roomName = room?.name || "Watch Party";
  const roomUrl = typeof window !== "undefined" ? window.location.href : "";

  // console.log("Logged-in user ID:", currentUserId);
  console.log("Room host ID:", hostId);
  console.log("Host status:", isHost);
  // console.log("Room code:", room.roomId);

  const fetchRoom = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    const response = await fetch(
      `${API_URL}/api/rooms/${encodeURIComponent(roomCode)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to load room.");
    }

    setRoom(data.room || data);
  };

  // socket useeffect

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    socket.auth = { token };

    const handleConnect = () => {
      console.log("Watchly Socket connected:", socket.id);
    };

    const handleConnectError = (error) => {
      console.error("Socket connection error:", error.message);
    };

    socket.on("connect", handleConnect);
    socket.on("connect_error", handleConnectError);
    socket.connect();

    return () => {
      socket.off("connect", handleConnect);
      socket.off("connect_error", handleConnectError);
      socket.disconnect();
    };
  }, [navigate]);

  useEffect(() => {
    if (!room?.roomId) return;

    const joinRoom = () => {
      socket.emit("room:join", { roomCode: room.roomId }, (result) => {
        if (!result?.success) {
          console.error("Room chat join failed:", result?.message);
        } else {
          console.log("Joined room chat:", result.roomCode);
        }
      });
    };

    const handleMessage = (message) => {
      setChatMessages((previous) => {
        // Avoid duplicate messages.
        if (previous.some((item) => item.id === message.id)) {
          return previous;
        }

        return [...previous, message];
      });
    };

    const handleAnnouncement = (announcement) => {
      setAnnouncements((previous) => {
        if (previous.some((item) => item.id === announcement.id)) {
          return previous;
        }

        return [...previous, announcement];
      });
    };

    socket.on("room:announcement", handleAnnouncement);

    socket.on("connect", joinRoom);
    socket.on("room:chat:message", handleMessage);

    if (socket.connected) {
      joinRoom();
    }

    return () => {
      socket.off("connect", joinRoom);
      socket.off("room:chat:message", handleMessage);
      return () => {
        socket.off("connect", joinRoom);
        socket.off("room:chat:message", handleMessage);
        socket.off("room:announcement", handleAnnouncement);
      };
    };
  }, [room?.roomId]);

  useEffect(() => {
    let cancelled = false;

    async function loadRoom() {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          navigate("/login", { replace: true });
          return;
        }

        const response = await fetch(
          `${API_URL}/api/rooms/${encodeURIComponent(roomCode)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load room.");
        }

        if (!cancelled) {
          setRoom(data.room || data);
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message === "Failed to fetch"
              ? "Cannot connect to the backend. Check your server."
              : err.message,
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadRoom();

    return () => {
      cancelled = true;
    };
  }, [roomCode, navigate]);

  const handleAddVideo = async (event) => {
    event.preventDefault();
    setNotice("");

    if (!youtubeUrl.trim()) {
      setNotice("Paste a YouTube video URL first.");
      return;
    }

    try {
      setSavingVideo(true);

      const response = await fetch(
        `${API_URL}/api/rooms/${encodeURIComponent(roomCode)}/video`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ youtubeUrl: youtubeUrl.trim() }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to update video.");
      }

      if (data.room) {
        setRoom(data.room);
      } else {
        await fetchRoom();
      }

      setYoutubeUrl("");
      setNotice("Video saved successfully.");
    } catch (err) {
      setNotice(
        err.message === "Failed to fetch"
          ? "Backend connection failed. Check that your server is running."
          : err.message,
      );
    } finally {
      setSavingVideo(false);
    }
  };

  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(room?.roomId || roomCode);
      setCopied(true);
      setNotice("Room code copied.");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setNotice(`Your room code is ${room?.roomId || roomCode}`);
    }
  };

  const shareRoom = async () => {
    const inviteText = `Join my Watchly watch party: ${roomName}\nRoom code: ${
      room?.roomId || roomCode
    }\n${roomUrl}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `Join ${roomName} on Watchly`,
          text: `Watch together with me! Room code: ${
            room?.roomId || roomCode
          }`,
          url: roomUrl,
        });
      } else {
        await navigator.clipboard.writeText(inviteText);
        setNotice("Invite copied. Share it with your friends.");
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        setNotice("Could not share the invite. Try copying the room code.");
      }
    }
  };

  const sendChatMessage = (event) => {
    event.preventDefault();

    const text = chatInput.trim();

    if (!text || !room?.roomId) return;

    if (!socket.connected) {
      setNotice("Chat is reconnecting. Please try again.");
      return;
    }

    socket.emit(
      "room:chat:send",
      {
        roomCode: room.roomId,
        text,
      },
      (result) => {
        if (!result?.success) {
          setNotice(result?.message || "Message could not be sent.");
        } else {
          setNotice("");
        }
      },
    );

    setChatInput("");
  };

  const sendAnnouncement = (event) => {
    event.preventDefault();

    const text = announcementInput.trim();

    if (!text || !room?.roomId) return;

    if (!socket.connected) {
      setNotice("Connection lost. Please try again.");
      return;
    }

    socket.emit(
      "room:announcement:send",
      { roomCode: room.roomId, text },
      (result) => {
        if (!result?.success) {
          setNotice(result?.message || "Announcement could not be sent.");
        } else {
          setNotice("");
          setAnnouncementInput("");
        }
      },
    );
  };

  useEffect(() => {
    if (!room?.roomId) return;

    const joinRoom = () => {
      socket.emit("room:join", { roomCode: room.roomId }, (result) => {
        if (result?.success) {
          console.log("Joined room chat:", result.roomCode);
        } else {
          console.error("Room chat join failed:", result?.message);
        }
      });
    };

    const handleMessage = (message) => {
      console.log("Live chat message received:", message);
      setChatMessages((previous) => {
        if (previous.some((item) => item.id === message.id)) {
          return previous;
        }

        return [...previous, message];
      });
    };

    const handlePlayback = ({ state, time }) => {
      const player = viewerPlayerRef.current;
      if (!player) return;

      const currentTime = player.getCurrentTime();

      if (Math.abs(currentTime - time) > 2) {
        player.seekTo(time, true);
      }

      if (state === "playing") {
        player.playVideo();
      } else if (state === "paused") {
        player.pauseVideo();
      }
    };

    socket.on("connect", joinRoom);
    socket.on("room:chat:message", handleMessage);
    socket.on("room:playback", handlePlayback);

    if (socket.connected) {
      joinRoom();
    }

    return () => {
      socket.off("connect", joinRoom);
      socket.off("room:chat:message", handleMessage);
      socket.off("room:playback", handlePlayback);
    };
  }, [room?.roomId]);

  if (loading) {
    return (
      <main className="wt-loading">
        <div className="wt-loader" />
        <h2>Preparing your watch party...</h2>
        <p>Getting the room ready.</p>
      </main>
    );
  }

  if (error || !room) {
    return (
      <main className="wt-error">
        <div className="wt-error-icon">!</div>
        <h1>We couldn't open this room</h1>
        <p>{error || "Room information is unavailable."}</p>
        <button className="wt-primary" onClick={() => navigate("/dashboard")}>
          Back to dashboard
        </button>
      </main>
    );
  }

  return (
    <div className={isHost ? "wt-app wt-host-app" : "wt-app wt-viewer-app"}>
      {/* TOP NAVIGATION */}
      <header className="wt-topbar">
        <button className="wt-brand" onClick={() => navigate("/dashboard")}>
          <span className="wt-brand-icon">W</span>
          <span>
            watchly<span className="wt-brand-dot">.</span>
          </span>
        </button>

        <div className="wt-topbar-center">
          <span className={`wt-status-dot ${isHost ? "" : "wt-cyan-dot"}`} />
          {isHost ? "HOST STUDIO" : "WATCH TOGETHER"}
        </div>

        <div className="wt-top-actions">
          <button className="wt-outline-button" onClick={shareRoom}>
            <span>↗</span> Share invite
          </button>
          <button
            className="wt-avatar"
            title={user.name || "Your profile"}
            onClick={() => navigate("/dashboard")}
          >
            {(user.name || user.username || "U").charAt(0).toUpperCase()}
          </button>
        </div>
      </header>

      {/* ROOM IDENTITY */}
      <section className="wt-room-heading">
        <div className="wt-room-heading-main">
          <div className="wt-eyebrow">
            <span>{isHost ? "YOUR STUDIO" : "YOU'RE WATCHING"}</span>
            <span className="wt-heading-divider">/</span>
            <span>{room.roomId || roomCode}</span>
          </div>
          <h1>{roomName}</h1>
          <p>
            {isHost
              ? "Your room, your rules. Get everyone together and press play."
              : "Get comfortable, settle in, and enjoy the watch party."}
          </p>
        </div>

        <div className="wt-room-heading-actions">
          <div className="wt-people-count">
            <span className="wt-online-dot" />
            <strong>{participants.length}</strong>
            <span>
              {participants.length === 1 ? "person" : "people"} in room
            </span>
          </div>
          <button className="wt-outline-button" onClick={copyRoomCode}>
            {copied ? "✓ Copied" : "▣ Copy code"}
          </button>
        </div>
      </section>

      {notice && (
        <div className="wt-notice" role="status">
          <span>✦</span>
          {notice}
          <button onClick={() => setNotice("")} aria-label="Dismiss">
            ×
          </button>
        </div>
      )}

      {/* HOST LAYOUT */}
      {isHost ? (
        <main className="wt-main wt-host-main">
          <section className="wt-player-column">
            <div className="wt-section-label">
              <span className="wt-label-icon">▶</span>
              NOW ON SCREEN
              <span className="wt-label-line" />
              <span className="wt-live-badge">HOST VIEW</span>
            </div>

            <div className="wt-video-frame">
              {room.videoId ? (
                <YouTube
                  videoId={room.videoId}
                  opts={{
                    width: "100%",
                    height: "100%",
                    playerVars: {
                      controls: 1,
                      enablejsapi: 1,
                      origin: window.location.origin,
                    },
                  }}
                  onReady={(event) => {
                    hostPlayerRef.current = event.target;
                  }}
                  onStateChange={(event) => {
                    if (event.data !== 1 && event.data !== 2) return;

                    const player = event.target;

                    socket.emit("room:playback", {
                      roomCode: room.roomId,
                      state: event.data === 1 ? "playing" : "paused",
                      time: player.getCurrentTime(),
                    });
                  }}
                />
              ) : (
                <div className="wt-no-video">
                  <div className="wt-play-orb">▶</div>
                  <h2>Your screen is ready.</h2>
                  <p>Add a YouTube video below to kick off the party.</p>
                  <span className="wt-empty-decoration">
                    WATCH TOGETHER · ANYWHERE
                  </span>
                </div>
              )}
            </div>

            <div className="wt-video-caption">
              <div>
                <span className="wt-caption-label">CURRENT VIDEO</span>
                <h2>
                  {room.videoId ? "Your selected video" : "Nothing playing yet"}
                </h2>
              </div>
              <span className="wt-playback-pill">
                <span className="wt-online-dot" />
                {room.isPlaying ? "Playing" : "Paused"}
              </span>
            </div>

            <section className="wt-panel wt-video-manager">
              <div className="wt-panel-heading">
                <div className="wt-panel-icon wt-purple-icon">▶</div>
                <div>
                  <h2>Video manager</h2>
                  <p>Add a video or switch to a different one.</p>
                </div>
              </div>

              <form onSubmit={handleAddVideo} className="wt-video-form">
                <label htmlFor="wt-youtube-url">YouTube video link</label>
                <div className="wt-input-row">
                  <span className="wt-input-prefix">↗</span>
                  <input
                    id="wt-youtube-url"
                    type="url"
                    placeholder="Paste a YouTube URL here..."
                    value={youtubeUrl}
                    onChange={(event) => setYoutubeUrl(event.target.value)}
                    required
                  />
                  <button className="wt-primary" disabled={savingVideo}>
                    {savingVideo
                      ? "Saving..."
                      : room.videoId
                        ? "Replace video ↗"
                        : "Add video ↗"}
                  </button>
                </div>
                <p className="wt-input-help">
                  Supports standard YouTube watch links, Shorts and youtu.be
                  links.
                </p>
              </form>
            </section>

            <section className="wt-host-tips">
              <span className="wt-tip-sparkle">✦</span>
              <div>
                <strong>You're in control</strong>
                <p>Only the host can change the video's URL in this room.</p>
              </div>
            </section>
          </section>

          {/* HOST SIDEBAR */}
          <aside className="wt-sidebar">
            <section className="wt-panel wt-host-card">
              <div className="wt-host-card-art">
                <div className="wt-art-circle wt-art-circle-one" />
                <div className="wt-art-circle wt-art-circle-two" />
                <span className="wt-crown">♛</span>
                <span className="wt-host-card-tag">ROOM OWNER</span>
              </div>
              <div className="wt-host-card-body">
                <span className="wt-mini-label">YOU'RE THE HOST</span>
                <h2>{user.name || user.username || "Room host"}</h2>
                <p>You're running this watch party.</p>
                <button className="wt-secondary-button" onClick={shareRoom}>
                  Invite your friends <span>↗</span>
                </button>
              </div>
            </section>

            <section className="wt-panel wt-side-panel">
              <div className="wt-side-heading">
                <div>
                  <h2>In this room</h2>
                  <p>Your watch party crew</p>
                </div>
                <span className="wt-count-badge">{participants.length}</span>
              </div>

              <div className="wt-participant-list">
                {participants.map((participant, index) => {
                  const participantId = String(
                    participant.userId?._id || participant.userId || "",
                  );
                  const isThisHost =
                    participant.role === "HOST" || participantId === hostId;
                  const displayName = isThisHost
                    ? user.name || user.username || "Host"
                    : `Participant ${index + 1}`;

                  return (
                    <div
                      className="wt-participant"
                      key={`${participantId}-${index}`}
                    >
                      <div
                        className={`wt-person-avatar wt-person-${index % 5}`}
                      >
                        {displayName.charAt(0).toUpperCase()}
                        <span className="wt-person-online" />
                      </div>
                      <div className="wt-person-info">
                        <strong>
                          {displayName}
                          {participantId === userId ? " (You)" : ""}
                        </strong>
                        <span>{isThisHost ? "Room host" : "Party guest"}</span>
                      </div>
                      {isThisHost && (
                        <span className="wt-role-badge">HOST</span>
                      )}
                    </div>
                  );
                })}

                {participants.length === 0 && (
                  <p className="wt-empty-small">No participants yet.</p>
                )}
              </div>

              <button className="wt-invite-link" onClick={shareRoom}>
                <span>＋</span> Invite someone new
              </button>
            </section>

            <section className="wt-panel wt-settings-panel">
              <button
                className="wt-settings-toggle"
                onClick={() => setSettingsOpen((open) => !open)}
                aria-expanded={settingsOpen}
              >
                <span className="wt-settings-icon">⚙</span>
                <span>
                  <strong>Room settings</strong>
                  <small>Manage your room</small>
                </span>
                <span className="wt-settings-chevron">
                  {settingsOpen ? "−" : "+"}
                </span>
              </button>

              {settingsOpen && (
                <div className="wt-settings-content">
                  <div className="wt-setting-row">
                    <span>Room name</span>
                    <strong>{roomName}</strong>
                  </div>
                  <div className="wt-setting-row">
                    <span>Room code</span>
                    <strong>{room.roomId || roomCode}</strong>
                  </div>
                  <div className="wt-setting-row">
                    <span>Video selected</span>
                    <strong>{room.videoId ? "Yes" : "Not yet"}</strong>
                  </div>
                  <div className="wt-setting-row">
                    <span>Playback state</span>
                    <strong>{room.isPlaying ? "Playing" : "Paused"}</strong>
                  </div>
                  <p className="wt-settings-note">
                    Room name and playback settings are currently read-only
                    here.
                  </p>
                </div>
              )}
            </section>
            <section className="wt-panel wt-chat-panel">
              <div className="wt-side-heading">
                <div>
                  <h2>Party chat</h2>
                  <p>Drop a message</p>
                </div>
                <span className="wt-chat-symbol">✧</span>
              </div>

              <ChatBox
                messages={chatMessages}
                chatInput={chatInput}
                setChatInput={setChatInput}
                sendChatMessage={sendChatMessage}
              />
            </section>

            {/* Host Announcements — ADD HERE */}
            {isHost && (
              <section className="wt-panel wt-announcement-panel">
                <div className="wt-side-heading">
                  <div>
                    <h2>Host Announcements</h2>
                    <p>Send an update to everyone</p>
                  </div>
                  <span>📢</span>
                </div>

                <form onSubmit={sendAnnouncement}>
                  <input
                    type="text"
                    value={announcementInput}
                    onChange={(event) =>
                      setAnnouncementInput(event.target.value)
                    }
                    placeholder="Write an announcement..."
                    maxLength={500}
                    required
                  />

                  <button type="submit" disabled={!announcementInput.trim()}>
                    Announce
                  </button>
                </form>

                <div className="wt-announcement-list">
                  {announcements.map((item) => (
                    <div key={item.id} className="wt-announcement-item">
                      <strong>📢 {item.name}</strong>
                      <p>{item.text}</p>
                      <small>{item.time}</small>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <button
              className="wt-back-button"
              onClick={() => navigate("/dashboard")}
            >
              <span>←</span> Back to dashboard
            </button>
          </aside>
        </main>
      ) : (
        /* VIEWER LAYOUT */
        <main className="wt-main wt-viewer-main">
          <section className="wt-viewer-stage">
            <div className="wt-viewer-stage-top">
              <div className="wt-stage-live">
                <span className="wt-online-dot" /> WATCH PARTY
              </div>
              <span className="wt-stage-room-name">{roomName}</span>
              <button className="wt-stage-share" onClick={shareRoom}>
                ↗ Share
              </button>
            </div>
            <section className="wt-panel wt-announcement-panel">
              <div className="wt-side-heading">
                <div>
                  <h2>📢 Host Announcements</h2>
                  <p>Updates from the host</p>
                </div>
              </div>

              <div className="wt-announcement-list">
                {announcements.map((item) => (
                  <div key={item.id} className="wt-announcement-item">
                    <strong>📢 {item.name}</strong>
                    <p>{item.text}</p>
                    <small>{item.time}</small>
                  </div>
                ))}
              </div>
            </section>

            <div className="wt-video-frame wt-viewer-video-frame">
              {room.videoId ? (
                <div className="viewer-video-wrapper">
                  <YouTube
                    videoId={room.videoId}
                    opts={{
                      width: "100%",
                      height: "100%",
                      playerVars: {
                        controls: 0,
                        disablekb: 1,
                        enablejsapi: 1,
                        origin: window.location.origin,
                      },
                    }}
                    onReady={(event) => {
                      viewerPlayerRef.current = event.target;
                    }}
                  />

                  <div className="viewer-video-overlay" />
                </div>
              ) : (
                <div className="wt-no-video wt-viewer-empty">
                  <div className="wt-viewer-play-icon">▶</div>
                  <span className="wt-mini-label">
                    YOUR NEXT MOVIE NIGHT STARTS HERE
                  </span>
                  <h2>Waiting for the host</h2>
                  <p>Grab a snack. Your host will add the video soon.</p>
                  <div className="wt-waiting-indicator">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              )}
            </div>

            <div className="wt-viewer-now-playing">
              <div className="wt-now-playing-icon">♫</div>
              <div className="wt-now-playing-text">
                <span>NOW WATCHING</span>
                <h2>
                  {room.videoId
                    ? "Your watch party video"
                    : "Waiting for a video"}
                </h2>
              </div>
              <div className="wt-watch-status">
                <span className="wt-online-dot" />
                {room.isPlaying ? "Playing" : "Paused"}
              </div>
            </div>

            <section className="wt-viewer-welcome">
              <div className="wt-welcome-icon">✦</div>
              <div>
                <h2>Better together.</h2>
                <p>
                  You're part of the party. Say hello in chat and enjoy the show
                  with everyone here.
                </p>
              </div>
            </section>

            <button
              className="wt-viewer-back"
              onClick={() => navigate("/dashboard")}
            >
              ← Leave room and return to dashboard
            </button>
          </section>

          <aside className="wt-viewer-sidebar">
            <section className="wt-panel wt-viewer-host-card">
              <div className="wt-viewer-host-banner">
                <span className="wt-host-star">✦</span>
                <span>YOUR HOST</span>
              </div>
              <div className="wt-viewer-host-body">
                <div className="wt-host-avatar-large">
                  {(room.hostId?.name || "H").charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2>Watch party host</h2>
                  <p>Your friend is in charge of the video.</p>
                </div>
              </div>
              <div className="wt-host-status">
                <span className="wt-online-dot" />
                Room host
              </div>
            </section>

            <section className="wt-panel wt-viewer-people">
              <div className="wt-side-heading">
                <div>
                  <h2>The crew</h2>
                  <p>Watching together</p>
                </div>
                <span className="wt-count-badge">{participants.length}</span>
              </div>

              <div className="wt-participant-list">
                {participants.map((participant, index) => {
                  const participantId = String(
                    participant.userId?._id || participant.userId || "",
                  );
                  const isThisHost =
                    participant.role === "HOST" || participantId === hostId;
                  const isMe = participantId === userId;
                  const displayName = isMe
                    ? user.name || user.username || "You"
                    : isThisHost
                      ? "Host"
                      : `Party guest ${index + 1}`;

                  return (
                    <div
                      className="wt-participant"
                      key={`${participantId}-${index}`}
                    >
                      <div
                        className={`wt-person-avatar wt-person-${index % 5}`}
                      >
                        {displayName.charAt(0).toUpperCase()}
                        <span className="wt-person-online" />
                      </div>
                      <div className="wt-person-info">
                        <strong>
                          {displayName}
                          {isMe ? " (You)" : ""}
                        </strong>
                        <span>
                          {isThisHost ? "Hosting the party" : "Here to watch"}
                        </span>
                      </div>
                      {isThisHost && (
                        <span className="wt-role-badge">HOST</span>
                      )}
                    </div>
                  );
                })}
              </div>

              <button className="wt-invite-link" onClick={shareRoom}>
                <span>＋</span> Invite more friends
              </button>
            </section>

            <section className="wt-panel wt-viewer-chat">
              <div className="wt-side-heading">
                <div>
                  <h2>Room chat</h2>
                  <p>Say hi to everyone</p>
                </div>
                <span className="wt-chat-symbol">✧</span>
              </div>
              <ChatBox
                messages={chatMessages}
                chatInput={chatInput}
                setChatInput={setChatInput}
                sendChatMessage={sendChatMessage}
              />
            </section>

            <div className="wt-viewer-room-code">
              <div>
                <span>ROOM INVITE CODE</span>
                <strong>{room.roomId || roomCode}</strong>
              </div>
              <button onClick={copyRoomCode}>{copied ? "✓" : "▣"}</button>
            </div>
          </aside>
        </main>
      )}

      <footer className="wt-footer">
        <span className="wt-footer-brand">
          watchly<span>.</span>
        </span>
        <span>Made for movie nights, no matter the distance.</span>
        <span>ROOM · {room.roomId || roomCode}</span>
      </footer>
    </div>
  );
}

function ChatBox({ messages, chatInput, setChatInput, sendChatMessage }) {
  return (
    <div className="wt-chat">
      <div className="wt-chat-messages">
        {messages.length === 0 ? (
          <div className="wt-chat-empty">
            <span>✧</span>
            <strong>It's a little quiet in here.</strong>
            <p>Be the first to say hello!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div className="wt-chat-message" key={message.id}>
              <div className="wt-chat-avatar">
                {message.name.charAt(0).toUpperCase()}
              </div>
              <div className="wt-chat-message-body">
                <div className="wt-chat-message-meta">
                  <strong>{message.name}</strong>
                  <span>{message.time}</span>
                </div>
                <p>{message.text}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <form className="wt-chat-form" onSubmit={sendChatMessage}>
        <input
          value={chatInput}
          onChange={(event) => setChatInput(event.target.value)}
          placeholder="Send a message..."
          aria-label="Chat message"
          maxLength={500}
        />
        <button
          type="submit"
          disabled={!chatInput.trim()}
          aria-label="Send message"
        >
          ↗
        </button>
      </form>
      <p className="wt-chat-disclaimer">
        Local demo chat · Not synced between users yet
      </p>
    </div>
  );
}
