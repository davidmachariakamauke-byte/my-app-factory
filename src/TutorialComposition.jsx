import { AbsoluteFill, Sequence, interpolate, useCurrentFrame } from "remotion";
import scriptData from "./videoScript.json" assert { type: "json" };

export const TutorialComposition = () => {
  let currentFrameOffset = 0;

  return (
    <AbsoluteFill style={{ backgroundColor: "#0f172a", color: "#ffffff", fontFamily: "sans-serif" }}>
      {scriptData.scenes.map((scene, index) => {
        const startFrame = currentFrameOffset;
        currentFrameOffset += scene.durationInFrames;

        return (
          <Sequence key={index} from={startFrame} durationInFrames={scene.durationInFrames}>
            <SceneCard scene={scene} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

const SceneCard = ({ scene }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateLeft: "clamp" });
  const translateY = interpolate(frame, [0, 15], [20, 0], { extrapolateLeft: "clamp" });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 40 }}>
      <div style={{ opacity, transform: `translateY(${translateY}px)`, textAlign: "center" }}>
        <h1 style={{ fontSize: 56, color: "#38bdf8", marginBottom: 20 }}>{scene.heading}</h1>
        <p style={{ fontSize: 28, color: "#94a3b8", maxWidth: 800, lineHeight: 1.5 }}>{scene.subtext}</p>
      </div>
    </AbsoluteFill>
  );
};
