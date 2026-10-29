import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/dashboard.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const popularRooms = [
  {
    id: 1,
    title: "Anime Universe",
    subtitle: "Anime & episode nights",
    image:
      "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=700&q=80",
    viewers: 12,
    tag: "Anime",
  },
  {
    id: 2,
    title: "Movie Night",
    subtitle: "Movies with friends",
    image:
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=700&q=80",
    viewers: 28,
    tag: "Movies",
  },
  {
    id: 3,
    title: "Music & Chill",
    subtitle: "Relax, listen and connect",
    image:
      "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=700&q=80",
    viewers: 18,
    tag: "Music",
  },
];

const features = [
  { icon: "◷", title: "Real-time Sync", text: "Watch together, in sync" },
  { icon: "▤", title: "Live Chat", text: "Chat while you watch" },
  { icon: "▣", title: "Multiple Rooms", text: "Create or join a room" },
  { icon: "♙", title: "Role-based Access", text: "Host · Moderator · Viewer" },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [modal, setModal] = useState("");
  const [roomName, setRoomName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [search, setSearch] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [myRooms, setMyRooms] = useState([]);
  const [myRoomsOpen, setMyRoomsOpen] = useState(false);
  const [roomsLoading, setRoomsLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    try {
      setUser(savedUser ? JSON.parse(savedUser) : null);
    } catch {
      setUser(null);
    }
  }, [navigate]);

  const firstName = user?.name?.trim().split(/\s+/)[0] || "there";
  const initials =
    user?.name
      ?.trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "W";

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  const openModal = (type) => {
    setMessage("");
    setModal(type);
  };

  const createRoom = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!roomName.trim()) {
      setMessage("Please enter a name for your room.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/api/rooms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ name: roomName.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to create room.");
      }

      const room = data.room || data;
      const roomCode = room.roomId;

      if (!roomCode) {
        throw new Error("Room code missing from server response.");
      }

      navigate(`/rooms/${roomCode}`);
    } catch (error) {
      setMessage(
        error.message === "Failed to fetch"
          ? "Cannot connect to the server. Check your backend and API route."
          : error.message,
      );
    } finally {
      setLoading(false);
    }
  };

  
  const joinRoom = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!roomCode.trim()) {
      setMessage("Enter a room code or room ID.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/api/rooms/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ roomCode: roomCode.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to join this room.");
      }

      const room = data.room || data;
      const returnedRoomCode = room.roomId;

      if (!returnedRoomCode) {
        throw new Error("Room code missing from server response.");
      }

      navigate(`/rooms/${returnedRoomCode}`);
    } catch (error) {
      setMessage(
        error.message === "Failed to fetch"
          ? "Cannot connect to the server. Check your backend and API route."
          : error.message,
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchMyRooms = async () => {
    setMyRoomsOpen(true);
    setMessage("");

    try {
      setRoomsLoading(true);

      const response = await fetch(`${API_URL}/api/rooms/my-rooms`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load your rooms.");
      }

      setMyRooms(data.rooms || []);
    } catch (error) {
      setMessage(
        error.message === "Failed to fetch"
          ? "Cannot connect to the backend."
          : error.message,
      );
      setMyRooms([]);
    } finally {
      setRoomsLoading(false);
    }
  };

  const filteredRooms = popularRooms.filter((room) =>
    `${room.title} ${room.subtitle} ${room.tag}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  return (
    <div className="wd-app">
      <aside className="wd-sidebar">
        <a
          className="wd-brand"
          href="/dashboard"
          onClick={(e) => {
            e.preventDefault();
            navigate("/dashboard");
          }}
        >
          <span className="wd-brand-icon">▶</span>
          <span>
            <strong>
              watchly<span>.</span>
            </strong>
            <small>Watch Together, Feel Closer</small>
          </span>
        </a>

        <p className="wd-nav-label">WORKSPACE</p>

        <nav className="wd-nav">
          <button
            className="wd-nav-item active"
            onClick={() => navigate("/dashboard")}
          >
            <span>⌂</span> Home
          </button>
          <button className="wd-nav-item" onClick={() => openModal("create")}>
            <span>＋</span> Create Room
          </button>
          <button className="wd-nav-item" onClick={() => openModal("join")}>
            <span>↗</span> Join Room
          </button>

          <button className="wd-nav-item" onClick={fetchMyRooms}>
            <span>▣</span> My Rooms
          </button>

          <button
            className="wd-nav-item"
            onClick={() =>
              setMessage(
                "Video discovery will be connected when the YouTube browsing feature is implemented.",
              )
            }
          >
            <span>▷</span> Browse Videos
          </button>
        </nav>

        <div className="wd-sidebar-bottom">
          <div className="wd-premium-card">
            <span className="wd-premium-icon">✦</span>
            <h3>Make it a moment.</h3>
            <p>Create a room, invite your people, and enjoy videos together.</p>
            <button onClick={() => openModal("create")}>
              Start a Watch Party <span>→</span>
            </button>
          </div>
          <div className="wd-sidebar-foot">Made for shared moments ✨</div>
        </div>
      </aside>

      <div className="wd-main">
        <header className="wd-topbar">
          <div className="wd-mobile-brand">
            <span className="wd-brand-icon">▶</span> watchly<span>.</span>
          </div>

          <label className="wd-search">
            <span>⌕</span>
            <input
              type="search"
              placeholder="Search rooms, videos or topics..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <kbd>⌘ K</kbd>
          </label>

          <div className="wd-user-area">
            <span className="wd-online-dot"></span>
            <button
              className="wd-profile-button"
              onClick={() => setProfileOpen(!profileOpen)}
            >
              <span className="wd-avatar">{initials}</span>
              <span className="wd-profile-name">
                {user?.name || "Your account"}
              </span>
              <span>⌄</span>
            </button>

            {profileOpen && (
              <div className="wd-profile-menu">
                <div className="wd-profile-menu-user">
                  <strong>{user?.name || "Watchly user"}</strong>
                  <span>{user?.email || "Signed in"}</span>
                </div>
                <button
                  onClick={() =>
                    setMessage("Profile settings will be added soon.")
                  }
                >
                  Account settings
                </button>
                <button onClick={logout} className="wd-logout">
                  ↪ Sign out
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="wd-content">
          {message && (
            <div className="wd-notice" role="status">
              <span>{message}</span>
              <button
                onClick={() => setMessage("")}
                aria-label="Dismiss message"
              >
                ×
              </button>
            </div>
          )}

          {myRoomsOpen && (
            <section className="wd-section">
              <div className="wd-section-heading">
                <div>
                  <span className="wd-section-kicker">YOUR WORKSPACE</span>
                  <h2>My Rooms</h2>
                  <p>Your created and joined watch parties.</p>
                </div>

                <button
                  className="wd-text-link"
                  onClick={() => setMyRoomsOpen(false)}
                >
                  Close ×
                </button>
              </div>

              {roomsLoading ? (
                <p>Loading your rooms...</p>
              ) : myRooms.length === 0 ? (
                <div className="wd-empty">
                  No rooms found. Create a room or join a friend's room.
                </div>
              ) : (
                <div className="wd-room-grid">
                  {myRooms.map((room) => {
                    const currentUser = JSON.parse(
                      localStorage.getItem("user") || "{}",
                    );

                    const isHost =
                      String(room.hostId?._id || room.hostId) ===
                      String(currentUser.id || currentUser._id);

                    return (
                      <article
                        className="wd-room-card"
                        key={room._id || room.roomId}
                      >
                        <div className="wd-room-info">
                          <div>
                            <h3>{room.name}</h3>
                            <p>Code: {room.roomId}</p>
                          </div>
                        </div>

                        <div className="wd-room-meta">
                          <span>{isHost ? "Host" : "Joined room"}</span>
                          <button
                            className="wd-btn-primary"
                            onClick={() => {
                              if (room.roomId) {
                                navigate(`/rooms/${room.roomId}`);
                              } else {
                                setMessage("This room has no room code.");
                              }
                            }}
                          >
                            Open Room →
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          <section className="wd-hero">
            <div className="wd-hero-copy">
              <span className="wd-eyebrow">
                <span></span> YOUR PEOPLE. YOUR VIDEOS.
              </span>
              <h1>
                Watch together.
                <br />
                <span>Create memories.</span>
              </h1>
              <p>
                Hey {firstName}, your next great watch party is just a click
                away. Bring everyone together, wherever they are.
              </p>
              <div className="wd-hero-actions">
                <button
                  className="wd-btn-primary"
                  onClick={() => openModal("create")}
                >
                  <span>＋</span> Create a Room
                </button>
                <button
                  className="wd-btn-secondary"
                  onClick={() => openModal("join")}
                >
                  <span>↗</span> Join with Code
                </button>
              </div>
              <div className="wd-hero-caption">
                <span className="wd-avatar-stack">
                  <i>N</i>
                  <i>A</i>
                  <i>R</i>
                </span>
                <span>
                  Good videos are better <strong>together.</strong>
                </span>
              </div>
            </div>
            <div className="wd-hero-art">
              <div className="wd-art-orbit orbit-one"></div>
              <div className="wd-art-orbit orbit-two"></div>
              <div className="wd-screen">
                <div className="wd-screen-top">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <div className="wd-screen-content">
                  <span className="wd-youtube-mark">▶</span>
                  <span className="wd-screen-title">
                    It's better
                    <br />
                    when we're together.
                  </span>
                  <span className="wd-screen-subtitle">
                    YOUR NEXT WATCH PARTY
                  </span>
                </div>
              </div>
              <div className="wd-float-card wd-float-top">
                <span>✦</span> Good vibes only
              </div>
              <div className="wd-float-card wd-float-bottom">
                <span className="wd-live-dot"></span> Ready when you are
              </div>
              <div className="wd-art-star star-one">✦</div>
              <div className="wd-art-star star-two">✧</div>
            </div>
          </section>

          <section className="wd-feature-strip">
            {features.map((feature) => (
              <div className="wd-feature" key={feature.title}>
                <span className="wd-feature-icon">{feature.icon}</span>
                <div>
                  <strong>{feature.title}</strong>
                  <small>{feature.text}</small>
                </div>
              </div>
            ))}
          </section>

          <section className="wd-section">
            <div className="wd-section-heading">
              <div>
                <span className="wd-section-kicker">DISCOVER</span>
                <h2>
                  Find your kind of room <span>✦</span>
                </h2>
                <p>Explore these example room themes or start your own.</p>
              </div>
              <button
                className="wd-text-link"
                onClick={() => openModal("join")}
              >
                Join a room <span>→</span>
              </button>
            </div>

            <div className="wd-room-grid">
              {filteredRooms.map((room, index) => (
                <article className="wd-room-card" key={room.id}>
                  <div className="wd-room-image">
                    <img src={room.image} alt="" loading="lazy" />
                    <span className="wd-room-tag">{room.tag}</span>
                    <span className="wd-room-decoration">
                      {["✦", "◈", "♫"][index % 3]}
                    </span>
                  </div>
                  <div className="wd-room-info">
                    <div>
                      <h3>{room.title}</h3>
                      <p>{room.subtitle}</p>
                    </div>
                    <button
                      className="wd-room-join"
                      onClick={() => openModal("join")}
                      aria-label={`Join ${room.title} using a room code`}
                    >
                      ↗
                    </button>
                  </div>
                  <div className="wd-room-meta">
                    <span>
                      <i></i> Example theme
                    </span>
                    <span>
                      {room.viewers} <small>inspiration</small>
                    </span>
                  </div>
                </article>
              ))}

              {filteredRooms.length === 0 && (
                <div className="wd-empty">
                  No matching themes. Try another search or create your own
                  room.
                </div>
              )}
            </div>
          </section>

          <section className="wd-bottom-grid">
            <div className="wd-create-banner">
              <div className="wd-banner-symbol">✳</div>
              <div>
                <span className="wd-section-kicker">
                  YOUR SPACE, YOUR RULES
                </span>
                <h2>Your next favorite room starts with you.</h2>
                <p>You host the room. Your friends bring the memories.</p>
              </div>
              <button
                className="wd-btn-primary"
                onClick={() => openModal("create")}
              >
                Create a Room <span>→</span>
              </button>
            </div>

            <div className="wd-tips-card">
              <span className="wd-tips-icon">♧</span>
              <div>
                <h3>Bring your people</h3>
                <p>Create a room and share its invite code with friends.</p>
              </div>
            </div>
          </section>

          <footer className="wd-footer">
            <span>© 2026 Watchly</span>
            <span>Watch Together, Feel Closer.</span>
          </footer>
        </main>
      </div>

      {modal && (
        <div
          className="wd-modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !loading) setModal("");
          }}
        >
          <section
            className="wd-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="wd-modal-title"
          >
            <button
              className="wd-modal-close"
              onClick={() => setModal("")}
              disabled={loading}
              aria-label="Close dialog"
            >
              ×
            </button>

            <div className="wd-modal-icon">
              {modal === "create" ? "＋" : "↗"}
            </div>
            <span className="wd-section-kicker">
              {modal === "create" ? "BE THE HOST" : "JOIN YOUR PEOPLE"}
            </span>
            <h2 id="wd-modal-title">
              {modal === "create" ? "Create your watch room" : "Enter the room"}
            </h2>
            <p>
              {modal === "create"
                ? "Give your room a name. You will become its Host."
                : "Enter the room code shared by your friend to join their watch party."}
            </p>

            <form onSubmit={modal === "create" ? createRoom : joinRoom}>
              {modal === "create" ? (
                <label className="wd-modal-label">
                  Room name
                  <input
                    autoFocus
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder="e.g. Friday Movie Night"
                    maxLength={60}
                    required
                  />
                </label>
              ) : (
                <label className="wd-modal-label">
                  Room code or ID
                  <input
                    autoFocus
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value)}
                    placeholder="Enter your invite code"
                    required
                  />
                </label>
              )}

              {message && (
                <div className="wd-modal-error" role="alert">
                  {message}
                </div>
              )}

              <button
                className="wd-btn-primary wd-modal-submit"
                type="submit"
                disabled={loading}
              >
                {loading
                  ? "Please wait..."
                  : modal === "create"
                    ? "Create Watch Room →"
                    : "Join Watch Room →"}
              </button>
            </form>

            <div className="wd-modal-note">
              🔒 Room access is managed securely by Watchly.
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
