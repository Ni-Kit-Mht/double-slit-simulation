import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

const WaveOpticsSimulation = () => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [slitMode, setSlitMode] = useState('double');
  const [wavelength, setWavelength] = useState(50);
  const [slitWidth, setSlitWidth] = useState(20);
  const [slitSeparation, setSlitSeparation] = useState(100);
  const [animationSpeed, setAnimationSpeed] = useState(0.1);
  const [time, setTime] = useState(0);
  const [canvasSize, setCanvasSize] = useState({ width: 900, height: 600 });
  const animationRef = useRef(null);

  // Responsive canvas sizing
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const isMobile = window.innerWidth < 768;
        const width = Math.min(containerWidth - 32, isMobile ? 500 : 900);
        const height = isMobile ? Math.min(width * 1.2, 500) : Math.min(width * 0.67, 600);
        setCanvasSize({ width, height });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const config = {
    width: canvasSize.width,
    height: canvasSize.height,
    sourceX: canvasSize.width * 0.11,
    slitX: canvasSize.width * 0.39,
    screenX: canvasSize.width * 0.83,
    centerY: canvasSize.height * 0.5,
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    const drawSimulation = (t) => {
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, config.width, config.height);

      drawLightSource(ctx, t);
      drawWavefrontsFromSource(ctx, t);
      drawSlitBarrier(ctx);
      drawWaveletsFromSlits(ctx, t);
      drawScreen(ctx);
      drawInterferencePattern(ctx, t);
      drawLabels(ctx);
    };

    const drawLightSource = (ctx, t) => {
      const size = Math.max(6, canvasSize.width * 0.009);
      ctx.fillStyle = '#ffff00';
      ctx.beginPath();
      const pulse = 0.3 + 0.2 * Math.sin(t * 0.1);
      ctx.arc(config.sourceX, config.centerY, size * pulse, 0, Math.PI * 2);
      ctx.fill();

      const glowSize = size * 3.5;
      const gradient = ctx.createRadialGradient(
        config.sourceX, config.centerY, 0,
        config.sourceX, config.centerY, glowSize
      );
      gradient.addColorStop(0, 'rgba(255, 255, 0, 0.3)');
      gradient.addColorStop(1, 'rgba(255, 255, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(config.sourceX - glowSize, config.centerY - glowSize, glowSize * 2, glowSize * 2);
    };

    const drawWavefrontsFromSource = (ctx, t) => {
      ctx.strokeStyle = 'rgba(255, 200, 0, 0.4)';
      ctx.lineWidth = Math.max(1.5, canvasSize.width * 0.002);

      for (let i = 0; i < 10; i++) {
        const radius = (t * 2 + i * wavelength) % (config.slitX - config.sourceX + 50);
        if (radius < config.slitX - config.sourceX) {
          ctx.beginPath();
          ctx.arc(config.sourceX, config.centerY, radius, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    };

    const drawSlitBarrier = (ctx) => {
      ctx.fillStyle = '#333';
      const barrierWidth = Math.max(10, canvasSize.width * 0.011);
      
      if (slitMode === 'single') {
        const slitHalfWidth = slitWidth / 2;
        ctx.fillRect(config.slitX - barrierWidth/2, 0, barrierWidth, config.centerY - slitHalfWidth);
        ctx.fillRect(config.slitX - barrierWidth/2, config.centerY + slitHalfWidth, barrierWidth, config.height - config.centerY - slitHalfWidth);
      } else {
        const slitHalfWidth = slitWidth / 2;
        const halfSep = slitSeparation / 2;
        
        ctx.fillRect(config.slitX - barrierWidth/2, 0, barrierWidth, config.centerY - halfSep - slitHalfWidth);
        ctx.fillRect(config.slitX - barrierWidth/2, config.centerY - halfSep + slitHalfWidth, barrierWidth, slitSeparation - 2 * slitHalfWidth);
        ctx.fillRect(config.slitX - barrierWidth/2, config.centerY + halfSep + slitHalfWidth, barrierWidth, config.height - config.centerY - halfSep - slitHalfWidth);
      }
    };

    const drawWaveletsFromSlits = (ctx, t) => {
      const slitPositions = slitMode === 'single' 
        ? [config.centerY]
        : [config.centerY - slitSeparation / 2, config.centerY + slitSeparation / 2];

      slitPositions.forEach(slitY => {
        for (let i = 0; i < 15; i++) {
          const radius = (t * 2 + i * wavelength / 2) % (config.screenX - config.slitX);
          if (radius > 5) {
            const alpha = Math.max(0, 0.3 - (radius / (config.screenX - config.slitX)) * 0.3);
            ctx.strokeStyle = `rgba(100, 200, 255, ${alpha})`;
            ctx.lineWidth = Math.max(1, canvasSize.width * 0.0017);
            ctx.beginPath();
            ctx.arc(config.slitX, slitY, radius, 0, Math.PI * 2);
            ctx.stroke();
          }
        }

        const dotSize = Math.max(3, canvasSize.width * 0.004);
        ctx.fillStyle = '#00ffff';
        ctx.beginPath();
        ctx.arc(config.slitX, slitY, dotSize, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const drawScreen = (ctx) => {
      ctx.fillStyle = '#444';
      const screenWidth = Math.max(8, canvasSize.width * 0.009);
      ctx.fillRect(config.screenX - screenWidth/2, 0, screenWidth, config.height);
    };

    const drawInterferencePattern = (ctx, t) => {
      const slitPositions = slitMode === 'single'
        ? [config.centerY]
        : [config.centerY - slitSeparation / 2, config.centerY + slitSeparation / 2];

      const patternWidth = Math.max(20, canvasSize.width * 0.033);
      const step = Math.max(1, Math.ceil(canvasSize.height / 300));

      for (let y = 0; y < config.height; y += step) {
        let totalAmplitude = 0;

        slitPositions.forEach(slitY => {
          const distance = Math.sqrt(
            Math.pow(config.screenX - config.slitX, 2) + 
            Math.pow(y - slitY, 2)
          );
          const phase = (distance / wavelength) * 2 * Math.PI - t * 0.1;
          totalAmplitude += Math.cos(phase);
        });

        const intensity = Math.pow((totalAmplitude / slitPositions.length), 2);
        const brightness = Math.floor(intensity * 255);
        
        ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;
        ctx.fillRect(config.screenX + Math.max(5, canvasSize.width * 0.011), y, patternWidth, step);
      }
    };

    const drawLabels = (ctx) => {
      ctx.fillStyle = '#fff';
      const fontSize = Math.max(10, canvasSize.width * 0.015);
      ctx.font = `${fontSize}px Arial`;
      
      ctx.fillText('Light Source', config.sourceX - fontSize * 2, config.centerY - fontSize * 2);
      ctx.fillText(slitMode === 'single' ? 'Single Slit' : 'Double Slit', 
                   config.slitX - fontSize * 2, fontSize * 2);
      ctx.fillText('Screen', config.screenX - fontSize * 1.5, fontSize * 2);
      
      const bottomY = config.height - fontSize * 0.5;
      ctx.fillText('Interference', config.screenX + fontSize * 0.5, bottomY - fontSize);
      ctx.fillText('Pattern', config.screenX + fontSize * 0.5, bottomY);
    };

    const animate = () => {
      drawSimulation(time);
      if (isPlaying) {
        setTime(t => t + animationSpeed);
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [time, isPlaying, slitMode, wavelength, slitWidth, slitSeparation, canvasSize, animationSpeed]);

  const handleReset = () => {
    setTime(0);
  };

  return (
    <div ref={containerRef} className="flex flex-col items-center gap-4 md:gap-6 p-4 md:p-8 bg-gray-900 min-h-screen">
      <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 md:mb-2 text-center">Wave Optics Simulation</h1>
      <p className="text-sm md:text-base text-gray-300 text-center max-w-2xl px-2">
        Interactive demonstration of wave diffraction and interference through single and double slits.
        Watch wavelets emanate from the slits and create interference patterns on the screen.
      </p>

      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        className="border-2 border-gray-700 rounded-lg shadow-2xl w-full max-w-full"
        style={{ maxWidth: '900px' }}
      />

      <div className="flex flex-wrap gap-2 md:gap-4 justify-center">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm md:text-base"
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm md:text-base"
        >
          <RotateCcw size={18} />
          Reset
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 w-full max-w-2xl bg-gray-800 p-4 md:p-6 rounded-lg">
        <div className="col-span-1 md:col-span-2">
          <label className="block text-white mb-2 font-semibold text-sm md:text-base">Slit Configuration</label>
          <div className="flex gap-2 md:gap-4">
            <button
              onClick={() => setSlitMode('single')}
              className={`flex-1 py-2 px-3 md:px-4 rounded transition-colors text-sm md:text-base ${
                slitMode === 'single' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Single Slit
            </button>
            <button
              onClick={() => setSlitMode('double')}
              className={`flex-1 py-2 px-3 md:px-4 rounded transition-colors text-sm md:text-base ${
                slitMode === 'double' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Double Slit
            </button>
          </div>
        </div>

        <div className="col-span-1 md:col-span-2">
          <label className="block text-white mb-2 text-sm md:text-base">
            Animation Speed: <span className="text-blue-400">{animationSpeed.toFixed(1)}x</span>
          </label>
          <input
            type="range"
            min="0.1"
            max="3"
            step="0.1"
            value={animationSpeed}
            onChange={(e) => setAnimationSpeed(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-white mb-2 text-sm md:text-base">
            Wavelength: <span className="text-blue-400">{wavelength}</span>
          </label>
          <input
            type="range"
            min="20"
            max="80"
            value={wavelength}
            onChange={(e) => setWavelength(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-white mb-2 text-sm md:text-base">
            Slit Width: <span className="text-blue-400">{slitWidth}</span>
          </label>
          <input
            type="range"
            min="10"
            max="50"
            value={slitWidth}
            onChange={(e) => setSlitWidth(Number(e.target.value))}
            className="w-full"
          />
        </div>

        {slitMode === 'double' && (
          <div className="col-span-1 md:col-span-2">
            <label className="block text-white mb-2 text-sm md:text-base">
              Slit Separation: <span className="text-blue-400">{slitSeparation}</span>
            </label>
            <input
              type="range"
              min="50"
              max="200"
              value={slitSeparation}
              onChange={(e) => setSlitSeparation(Number(e.target.value))}
              className="w-full"
            />
          </div>
        )}
      </div>

      <div className="bg-gray-800 p-4 md:p-6 rounded-lg max-w-2xl text-gray-300 w-full">
        <h3 className="text-lg md:text-xl font-semibold text-white mb-3">How It Works</h3>
        <ul className="space-y-2 text-sm md:text-base">
          <li><strong className="text-blue-400">Yellow circles:</strong> Wavefronts from the light source</li>
          <li><strong className="text-cyan-400">Cyan circles:</strong> Wavelets emanating from the slit(s)</li>
          <li><strong className="text-white">Right panel:</strong> Intensity distribution on the screen</li>
          <li><strong className="text-green-400">Bright bands:</strong> Constructive interference (waves in phase)</li>
          <li><strong className="text-red-400">Dark bands:</strong> Destructive interference (waves out of phase)</li>
        </ul>
      </div>
    </div>
  );
};

export default WaveOpticsSimulation;
