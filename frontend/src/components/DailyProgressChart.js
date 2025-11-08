// frontend/src/components/DailyProgressChart.js
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSummary } from '../redux/slices/timeSlice';

const DailyProgressChart = ({ days = 14 }) => {
  const dispatch = useDispatch();
  const { summary } = useSelector((s) => s.time);

  useEffect(() => {
    dispatch(fetchSummary(days));
  }, [dispatch, days]);

  const bars = summary.perDay || [];

  const max = Math.max(60, ...bars.map((b) => b.totalMinutes));

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Daily Progress</h3>
        <span className="text-sm text-gray-500">Last {days} days</span>
      </div>
      <div className="grid grid-cols-14 gap-2">
        {bars.map((b) => {
          const height = Math.round((b.totalMinutes / max) * 120);
          const hours = (b.totalMinutes / 60).toFixed(1);
          return (
            <div key={b._id} className="flex flex-col items-center">
              <div className="w-6 bg-primary-500 rounded" style={{ height: `${height}px` }} title={`${hours}h`}></div>
              <div className="text-[10px] text-gray-500 mt-1">{b._id.slice(5)}</div>
            </div>
          );
        })}
      </div>
      {bars.length === 0 && (
        <div className="text-sm text-gray-500">No time logged yet.</div>
      )}
    </div>
  );
};

export default DailyProgressChart;
