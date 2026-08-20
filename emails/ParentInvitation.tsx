interface ParentInvitationEmailProps {
  childName: string;
  roomName: string;
  code: string;
  expiresAt: string;
}

export function ParentInvitationEmail({ childName, roomName, code, expiresAt }: ParentInvitationEmailProps) {
  const activateUrl = `/activate-account?code=${encodeURIComponent(code)}`;
  return (
    <div
      style={{
        fontFamily: "system-ui, -apple-system, sans-serif",
        backgroundColor: "#FFFBF5",
        padding: "32px",
        color: "#3F362E",
      }}
    >
      <div
        style={{
          maxWidth: "480px",
          margin: "0 auto",
          backgroundColor: "#FFFFFF",
          borderRadius: "24px",
          border: "1px solid #EDE6DD",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "28px 28px 0 28px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              background: "linear-gradient(to bottom right, #f8c3a8, #f2937a)",
              color: "#fff",
              fontWeight: 800,
              fontSize: "20px",
              marginBottom: "16px",
            }}
          >
            OD
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: "22px",
              fontWeight: 700,
              color: "#3F362E",
              lineHeight: 1.2,
            }}
          >
            Te invitaron a OpenDaycare
          </h1>
          <p style={{ margin: "10px 0 0 0", fontSize: "15px", color: "#8A7C6D", lineHeight: 1.5 }}>
            Te invitaron a vincularte con {childName} de {roomName}.
          </p>
        </div>

        <div
          style={{
            margin: "22px 28px",
            border: "1.5px dashed #E6D08A",
            backgroundColor: "#FBF1D6",
            borderRadius: "16px",
            padding: "18px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              fontWeight: 800,
              letterSpacing: "0.7px",
              color: "#A88526",
              marginBottom: "8px",
            }}
          >
            CÓDIGO DE INVITACIÓN
          </div>
          <div
            style={{
              fontSize: "34px",
              fontWeight: 700,
              letterSpacing: "7px",
              color: "#8A7234",
              fontFamily: "Georgia, serif",
            }}
          >
            {code}
          </div>
          <div style={{ marginTop: "8px", fontSize: "13px", color: "#A88526" }}>Vence en 7 días</div>
          <div style={{ marginTop: "4px", fontSize: "12px", color: "#8A7C6D" }}>{expiresAt}</div>
        </div>

        <div style={{ padding: "0 28px 28px 28px", textAlign: "center" }}>
          <a
            href={activateUrl}
            style={{
              display: "inline-block",
              background: "linear-gradient(to bottom, #F4977E, #EE8164)",
              color: "#fff",
              textDecoration: "none",
              fontWeight: 800,
              fontSize: "15px",
              padding: "14px 24px",
              borderRadius: "14px",
            }}
          >
            Activar cuenta →
          </a>
          <p style={{ margin: "16px 0 0 0", fontSize: "13px", color: "#8A7C6D" }}>
            O ingresá el código manualmente en <span style={{ fontWeight: 700 }}>{activateUrl}</span>
          </p>
        </div>
      </div>
      <p style={{ textAlign: "center", fontSize: "12px", color: "#B6A99B", marginTop: "16px" }}>
        OpenDaycare — {childName} · Sala {roomName}
      </p>
    </div>
  );
}

export default ParentInvitationEmail;
