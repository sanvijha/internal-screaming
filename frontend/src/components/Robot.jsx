export default function Robot({ active, label, type }) {
    const getImage = () => {
      if (type === "mind") return "/robotl.png";
      if (type === "heart") return "/robotr.png";
      return "/robot.png"; // final verdict
    };
  
    return (
      <div className={active ? "robot-active" : "robot-inactive"}>
        <div className="robot-img-wrap">
          <img
            src={getImage()}
            alt={label}
            className="robot-img"
          />
          <div className="robot-glow" />
        </div>
        <p className={`robot-label ${type}`}>{label}</p>
      </div>
    );
  }