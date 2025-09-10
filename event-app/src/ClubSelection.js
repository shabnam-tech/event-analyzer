
import React from "react";
import { useNavigate } from "react-router-dom";
import "./ClubSelection.css";

const clubs = ["CSEA", "AlgoGeeks", "Glugot", "ARVR", "CSI","IEEE"];

export default function ClubSelection() {
  const navigate = useNavigate();

  const handleSelectClub = (club) => {
      navigate(`/dashboard/${encodeURIComponent(club)}`);
  };

  return (
    <main className="page">
      <div className="card">
        <div className="card__head">
          <h1>Select a Club</h1>
        </div>
        <section className="form grid">
          {clubs.map((club) => (
            <div
              key={club}
              className="dropzone"
              onClick={() => handleSelectClub(club)}
              style={{ cursor: "pointer" }}
            >
              <div className="dropzone__content">
                <img
                  src={`/logos/${club}.png`} // logos inside public/logos
                  alt={`${club} logo`}
                  style={{
                    width: "80px",
                    height: "80px",
                    marginBottom: "10px",
                    objectFit: "contain",
                  }}
                />
                
              </div>
              <span style={{ fontWeight: "600", fontSize: "1.1rem" }}>
                  {club}
                </span>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}

