import React from 'react';
import Image from 'next/image';

interface JerseyPreviewProps {
  name: string;
  number: string;
  jerseyImage?: string;
}

const JerseyPreview: React.FC<JerseyPreviewProps> = ({ name, number, jerseyImage }) => {
  // Calculate the radius and path for the curved text
  const calculateCurvedTextPath = (text: string) => {
    const radius = 150; // Increased radius for gentler curve
    const startAngle = -25; // Adjusted for more even spread
    const endAngle = 25; // Adjusted for more even spread
    const angleSpread = endAngle - startAngle;
    
    // Calculate angle per character with fixed spacing
    const fixedSpacing = 12; // Degrees between each character
    const totalChars = text.length;
    const totalSpacing = fixedSpacing * (totalChars - 1);
    const startOffset = -totalSpacing / 2;
    
    return text.split('').map((char, i) => {
      const angle = (startOffset + (i * fixedSpacing)) * (Math.PI / 180);
      const x = radius * Math.sin(angle) + 190;
      const y = -radius * Math.cos(angle) + 100;
      const rotation = angle * (180 / Math.PI);
      
      return {
        char,
        transform: `translate(${x}px, ${y}px) rotate(${rotation}deg)`,
      };
    });
  };

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
        {/* Curved name text */}
        {name && (
          <div 
            className="absolute top-[30%] left-[55%] w-full transform -translate-x-1/2"
            style={{
              perspective: '1000px',
            }}
          >
            <div className="relative">
              {calculateCurvedTextPath(name).map((char, index) => (
                <span
                  key={index}
                  className="absolute text-4xl font-bold uppercase"
                  style={{
                    transform: char.transform,
                    transformOrigin: 'center bottom',
                    fontFamily: 'Arial, sans-serif',
                    letterSpacing: '0',
                    color: '#000000',
                  }}
                >
                  {char.char}
                </span>
              ))}
            </div>
          </div>
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