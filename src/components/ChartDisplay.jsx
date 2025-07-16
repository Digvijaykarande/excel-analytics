import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import Chart from 'chart.js/auto';

const ChartDisplay = forwardRef(({ data, xKey, yKey, type }, ref) => {
  const canvasRef = useRef();
  let chartInstance = useRef();

  useImperativeHandle(ref, () => ({
    downloadImage: (format = 'png') => {
      const canvas = canvasRef.current;
      const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
      const image = canvas.toDataURL(mimeType);
      const link = document.createElement('a');
      link.href = image;
      link.download = `chart.${format}`;
      link.click();
    }
  }));

  useEffect(() => {
    const ctx = canvasRef.current.getContext('2d');
    chartInstance.current = new Chart(ctx, {
      type,
      data: {
        labels: data.map(row => row[xKey]),
        datasets: [{
          label: `${yKey} vs ${xKey}`,
          data: data.map(row => row[yKey]),
          backgroundColor: 'rgba(134, 129, 129, 0.71)',
          borderColor: 'rgba(254, 255, 255, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: false,
        scales: {
          y: { beginAtZero: true }
        }
      }
    });

    return () => chartInstance.current.destroy();
  }, [data, xKey, yKey, type]);

  return (
    <canvas
      ref={canvasRef}
      width={550}
      height={410}
      style={{ marginTop: '30px' }}
    />
  );
});

export default ChartDisplay;
