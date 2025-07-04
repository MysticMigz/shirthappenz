import React from 'react';
import Image from 'next/image';

interface JerseyPreviewProps {
  name: string;
  number: string;
  jerseyImage?: string;
}

const JerseyPreview: React.FC<JerseyPreviewProps> = ({ name, number, jerseyImage }) => {
  const totalChars = name.length;

  // Gentle, shallow arc for realistic football shirt look
  const minArc = 50; // minimum arc sweep in degrees
  const maxArc = 70; // maximum arc sweep in degrees
  const minRadius = 120;
  const maxRadius = 150;
  const minFont = 18;
  const maxFont = 38;

  // Arc sweep: slightly wider for longer names
  const arcSweep = Math.min(maxArc, minArc + (totalChars - 5) * 3);
  const arcSweepClamped = Math.max(minArc, Math.min(maxArc, arcSweep));

  // Radius: smaller for longer names
  const radius = Math.max(minRadius, maxRadius - (totalChars - 7) * 3);
  const radiusClamped = Math.max(minRadius, Math.min(maxRadius, radius));

  // Font size: smaller for longer names
  const fontSize = Math.max(minFont, maxFont - (totalChars - 7) * 1.5);
  const fontSizeClamped = Math.max(minFont, Math.min(maxFont, fontSize));

  // Arc angles (in degrees)
  const arcCenter = 270; // top center
  const arcStart = arcCenter - arcSweepClamped / 2;
  const arcEnd = arcCenter + arcSweepClamped / 2;
  // SVG center
  const cx = 190;
  // Move arc higher up (closer to the collar)
  const cy = 70;

  // Describe the arc path for <textPath>
  const describeArc = (cx: number, cy: number, r: number, startAngle: number, endAngle: number) => {
    const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
      const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
      return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
      };
    };
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const arcSweep = endAngle - startAngle <= 180 ? "0" : "1";
    return [
      "M", start.x, start.y,
      "A", r, r, 0, arcSweep, 0, end.x, end.y
    ].join(" ");
  };

  const arcPath = describeArc(cx, cy, radiusClamped, arcStart, arcEnd);

  return (
    <div className="relative w-full aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden">
      {/* Jersey template image */}
      <div className="absolute inset-0">
        <Image
          src="/images/backJerseyPreview.png"
          alt="Jersey back template"
          fill
          className="object-contain"
          priority
        />
      </div>
      {/* Name and number overlay */}
      <div className="absolute inset-0">
        {/* Curved name text using SVG <textPath> */}
        {name && (
          <svg
            width={380}
            height={160}
            style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }}
          >
            <defs>
              <path id="jersey-arc" d={arcPath} />
            </defs>
            <text
              fontFamily="Arial, sans-serif"
              fontWeight="bold"
              fontSize={fontSizeClamped}
              fill="#000000"
              textAnchor="middle"
              letterSpacing="0.05em"
            >
              <textPath
                href="#jersey-arc"
                startOffset="50%"
                alignmentBaseline="middle"
                dominantBaseline="middle"
              >
                {name.toUpperCase()}
              </textPath>
            </text>
          </svg>
        )}
        {/* Centered number */}
        {number && (
          <div 
            className="absolute top-[45%] left-1/2 transform -translate-x-1/2 -translate-y-1/2"
            style={{ 
              color: '#000000',
              fontFamily: 'Arial, sans-serif',
              fontSize: '140px',
              fontWeight: 'bold',
              lineHeight: 1,
              letterSpacing: '0.05em'
            }}
          >
            {number}
          </div>
        )}
      </div>
    </div>
  );
};

export default JerseyPreview; 