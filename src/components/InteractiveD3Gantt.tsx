import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Task, TeamMember, Project } from '../types';
import { ARCHITECTURE_PHASES } from '../data/mockData';
import {
  Calendar,
  GripHorizontal,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Info,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  ZoomIn,
  ZoomOut
} from 'lucide-react';

interface InteractiveD3GanttProps {
  tasks: Task[];
  projects: Project[];
  teamMembers: TeamMember[];
  onEditTask: (task: Task) => void;
  onUpdateTaskDates: (taskId: string, newStartDate: string, newEndDate: string) => void;
  onSelectProject?: (projectId: string) => void;
}

interface DragState {
  taskId: string;
  type: 'move' | 'resize-start' | 'resize-end';
  origStartDate: string;
  origEndDate: string;
  currentStartDate: string;
  currentEndDate: string;
  durationDays: number;
}

const ROW_HEIGHT = 44;
const HEADER_HEIGHT = 50;
const SIDEBAR_WIDTH = 280;

export const InteractiveD3Gantt: React.FC<InteractiveD3GanttProps> = ({
  tasks,
  projects,
  teamMembers,
  onEditTask,
  onUpdateTaskDates,
  onSelectProject,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Dragging active state
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<'compact' | 'normal' | 'detailed'>('normal');

  // Compute timeline domain with padding
  const { minDate, maxDate, totalDays } = useMemo(() => {
    if (tasks.length === 0) {
      const now = new Date();
      const min = new Date(now.getFullYear(), now.getMonth(), 1);
      const max = new Date(now.getFullYear(), now.getMonth() + 2, 0);
      return {
        minDate: min,
        maxDate: max,
        totalDays: 60,
      };
    }

    let minTime = Infinity;
    let maxTime = -Infinity;

    tasks.forEach((t) => {
      if (t.startDate) {
        const s = new Date(t.startDate + 'T00:00:00').getTime();
        if (!isNaN(s) && s < minTime) minTime = s;
      }
      if (t.endDate) {
        const e = new Date(t.endDate + 'T00:00:00').getTime();
        if (!isNaN(e) && e > maxTime) maxTime = e;
      }
    });

    if (minTime === Infinity || maxTime === -Infinity) {
      const now = new Date();
      minTime = now.getTime() - 7 * 86400000;
      maxTime = now.getTime() + 60 * 86400000;
    }

    // Add padding days
    const padBefore = zoomLevel === 'compact' ? 5 : zoomLevel === 'detailed' ? 12 : 7;
    const padAfter = zoomLevel === 'compact' ? 10 : zoomLevel === 'detailed' ? 20 : 14;

    const padMin = new Date(minTime - padBefore * 86400000);
    padMin.setHours(0, 0, 0, 0);

    const padMax = new Date(maxTime + padAfter * 86400000);
    padMax.setHours(23, 59, 59, 999);

    const diffDays = Math.max(Math.ceil((padMax.getTime() - padMin.getTime()) / 86400000), 14);

    return {
      minDate: padMin,
      maxDate: padMax,
      totalDays: diffDays,
    };
  }, [tasks, zoomLevel]);

  // Day width based on zoom
  const dayWidth = useMemo(() => {
    switch (zoomLevel) {
      case 'compact':
        return 22;
      case 'detailed':
        return 48;
      case 'normal':
      default:
        return 32;
    }
  }, [zoomLevel]);

  const timelineWidth = useMemo(() => {
    return Math.max(totalDays * dayWidth, 900);
  }, [totalDays, dayWidth]);

  // D3 Time Scale: maps Date -> Pixel X coordinate inside chart area
  const timeScale = useMemo(() => {
    return d3.scaleTime().domain([minDate, maxDate]).range([0, timelineWidth]);
  }, [minDate, maxDate, timelineWidth]);

  // Helper date conversions
  const dateToX = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return timeScale(d);
  };

  const xToDateStr = (x: number): string => {
    const d = timeScale.invert(x);
    // Snap to nearest midnight
    const rounded = d3.timeDay.round(d);
    return rounded.toISOString().slice(0, 10);
  };

  // Generate grid columns (Days and Weeks) using D3 time intervals
  const calendarTicks = useMemo(() => {
    const days = d3.timeDay.range(minDate, maxDate);
    const months = d3.timeMonth.range(minDate, maxDate);

    return {
      days: days.map((d) => ({
        date: d,
        x: timeScale(d),
        isWeekend: d.getDay() === 0 || d.getDay() === 6,
        isMonday: d.getDay() === 1,
        dayNum: d.getDate(),
        monthNum: d.getMonth() + 1,
      })),
      months: months.map((m) => ({
        date: m,
        x: timeScale(m),
        label: d3.timeFormat('%B %Y')(m),
      })),
    };
  }, [minDate, maxDate, timeScale]);

  // Today position in timeline
  const todayX = useMemo(() => {
    const now = new Date();
    if (now < minDate || now > maxDate) return null;
    return timeScale(now);
  }, [minDate, maxDate, timeScale]);

  const getMember = (id: string) => teamMembers.find((m) => m.id === id);
  const getProject = (id: string) => projects.find((p) => p.id === id);

  const getPhaseColor = (phaseId: string) => {
    const p = ARCHITECTURE_PHASES.find((item) => item.id === phaseId);
    return p ? p.color : '#64748B';
  };

  // Setup D3 Drag Behavior on the SVG elements
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);

    // 1. Drag Entire Task Bar (Move in Time)
    const dragBar = d3
      .drag<SVGGElement, Task>()
      .subject(function () {
        const el = d3.select(this);
        const startX = parseFloat(el.attr('data-start-x') || '0');
        return { x: startX, y: 0 };
      })
      .on('start', function (event, d) {
        event.sourceEvent.stopPropagation();
        const startX = dateToX(d.startDate);
        const endX = dateToX(d.endDate);
        const durDays = Math.max(
          Math.round((new Date(d.endDate + 'T00:00:00').getTime() - new Date(d.startDate + 'T00:00:00').getTime()) / 86400000),
          1
        );

        setDragState({
          taskId: d.id,
          type: 'move',
          origStartDate: d.startDate,
          origEndDate: d.endDate,
          currentStartDate: d.startDate,
          currentEndDate: d.endDate,
          durationDays: durDays,
        });

        d3.select(this).raise().classed('is-dragging', true);
      })
      .on('drag', function (event, d) {
        if (!dragState && event.dx === 0) return;

        // Calculate delta X from start
        const newStartX = Math.max(0, Math.min(timelineWidth - 40, event.x));
        const newStartStr = xToDateStr(newStartX);

        // Preserve duration
        const startDateObj = new Date(newStartStr + 'T00:00:00');
        const durDays = Math.max(
          Math.round((new Date(d.endDate + 'T00:00:00').getTime() - new Date(d.startDate + 'T00:00:00').getTime()) / 86400000),
          1
        );
        const newEndDateObj = new Date(startDateObj.getTime() + durDays * 86400000);
        const newEndStr = newEndDateObj.toISOString().slice(0, 10);

        setDragState((prev) =>
          prev
            ? {
                ...prev,
                currentStartDate: newStartStr,
                currentEndDate: newEndStr,
              }
            : null
        );
      })
      .on('end', function (event, d) {
        d3.select(this).classed('is-dragging', false);
        setDragState((latest) => {
          if (latest && (latest.currentStartDate !== latest.origStartDate || latest.currentEndDate !== latest.origEndDate)) {
            onUpdateTaskDates(latest.taskId, latest.currentStartDate, latest.currentEndDate);
          }
          return null;
        });
      });

    // 2. Drag Left Handle (Resize Start Date)
    const dragLeftHandle = d3
      .drag<SVGRectElement, Task>()
      .on('start', function (event, d) {
        event.sourceEvent.stopPropagation();
        setDragState({
          taskId: d.id,
          type: 'resize-start',
          origStartDate: d.startDate,
          origEndDate: d.endDate,
          currentStartDate: d.startDate,
          currentEndDate: d.endDate,
          durationDays: 1,
        });
      })
      .on('drag', function (event, d) {
        const mouseX = Math.max(0, event.x);
        const candidateStart = xToDateStr(mouseX);
        // Ensure start <= end
        if (candidateStart <= d.endDate) {
          setDragState((prev) =>
            prev
              ? {
                  ...prev,
                  currentStartDate: candidateStart,
                }
              : null
          );
        }
      })
      .on('end', function (event, d) {
        setDragState((latest) => {
          if (latest && latest.currentStartDate !== latest.origStartDate) {
            onUpdateTaskDates(latest.taskId, latest.currentStartDate, latest.currentEndDate);
          }
          return null;
        });
      });

    // 3. Drag Right Handle (Resize End Date)
    const dragRightHandle = d3
      .drag<SVGRectElement, Task>()
      .on('start', function (event, d) {
        event.sourceEvent.stopPropagation();
        setDragState({
          taskId: d.id,
          type: 'resize-end',
          origStartDate: d.startDate,
          origEndDate: d.endDate,
          currentStartDate: d.startDate,
          currentEndDate: d.endDate,
          durationDays: 1,
        });
      })
      .on('drag', function (event, d) {
        const mouseX = Math.max(0, event.x);
        const candidateEnd = xToDateStr(mouseX);
        // Ensure end >= start
        if (candidateEnd >= d.startDate) {
          setDragState((prev) =>
            prev
              ? {
                  ...prev,
                  currentEndDate: candidateEnd,
                }
              : null
          );
        }
      })
      .on('end', function (event, d) {
        setDragState((latest) => {
          if (latest && latest.currentEndDate !== latest.origEndDate) {
            onUpdateTaskDates(latest.taskId, latest.currentStartDate, latest.currentEndDate);
          }
          return null;
        });
      });

    // Apply drag listeners to elements
    svg.selectAll<SVGGElement, Task>('.d3-task-bar-group').each(function (task) {
      const g = d3.select(this);
      // Main bar drag
      g.select<SVGGElement>('.d3-task-body').datum(task).call(dragBar as any);
      // Left handle drag
      g.select<SVGRectElement>('.d3-handle-left').datum(task).call(dragLeftHandle as any);
      // Right handle drag
      g.select<SVGRectElement>('.d3-handle-right').datum(task).call(dragRightHandle as any);
    });
  }, [tasks, timeScale, timelineWidth, onUpdateTaskDates]);

  // Center scroll on Today or earliest task on mount
  useEffect(() => {
    if (containerRef.current && todayX !== null) {
      const targetScroll = Math.max(0, todayX - 300);
      containerRef.current.scrollLeft = targetScroll;
    }
  }, [zoomLevel]);

  const totalHeight = HEADER_HEIGHT + tasks.length * ROW_HEIGHT + 40;

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
      {/* Top Interactive Controls & Instructions */}
      <div className="p-4 border-b border-neutral-200 bg-stone-900 text-white flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
            <GripHorizontal className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                Cronograma Interativo D3
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-amber-400 text-stone-950 rounded-full uppercase">
                  Arrastar & Soltar
                </span>
              </h3>
            </div>
            <p className="text-xs text-stone-300 mt-0.5">
              Arraste o corpo da barra para alterar as datas, ou puxe as alças laterais para estender ou reduzir o prazo.
            </p>
          </div>
        </div>

        {/* Zoom & View Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="bg-stone-800 p-0.5 rounded-lg border border-stone-700 flex items-center text-xs">
            <button
              type="button"
              onClick={() => setZoomLevel('compact')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                zoomLevel === 'compact' ? 'bg-amber-500 text-stone-950 font-bold' : 'text-stone-300 hover:text-white'
              }`}
            >
              Compacto
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel('normal')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                zoomLevel === 'normal' ? 'bg-amber-500 text-stone-950 font-bold' : 'text-stone-300 hover:text-white'
              }`}
            >
              Padrão
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel('detailed')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                zoomLevel === 'detailed' ? 'bg-amber-500 text-stone-950 font-bold' : 'text-stone-300 hover:text-white'
              }`}
            >
              Detalhado
            </button>
          </div>

          {todayX !== null && (
            <button
              type="button"
              onClick={() => {
                if (containerRef.current && todayX !== null) {
                  containerRef.current.scrollTo({ left: Math.max(0, todayX - 300), behavior: 'smooth' });
                }
              }}
              className="px-3 py-1.5 text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-white rounded-lg border border-stone-700 transition-colors flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              Centralizar Hoje
            </button>
          )}
        </div>
      </div>

      {/* Live Dragging Floating Indicator */}
      {dragState && (
        <div className="bg-amber-50 border-b border-amber-300 px-6 py-2 flex items-center justify-between text-xs font-medium text-amber-950 animate-in fade-in duration-100">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <span>
              Ajustando:{' '}
              <strong className="font-bold text-stone-900">
                {tasks.find((t) => t.id === dragState.taskId)?.title || 'Tarefa'}
              </strong>
            </span>
          </div>
          <div className="flex items-center gap-3 font-mono font-bold">
            <span className="text-amber-800 line-through">
              {dragState.origStartDate} → {dragState.origEndDate}
            </span>
            <span className="text-stone-400">➔</span>
            <span className="px-2 py-0.5 rounded-md bg-amber-400 text-stone-950 shadow-2xs">
              {dragState.currentStartDate} → {dragState.currentEndDate}
            </span>
          </div>
        </div>
      )}

      {/* Main Split Layout: Fixed Task List on Left + D3 Scrollable Canvas on Right */}
      <div className="flex flex-1 min-h-[480px] overflow-hidden relative">
        {/* Left Column: Fixed Task List */}
        <div
          className="border-r border-neutral-200 bg-neutral-50/80 shrink-0 z-20 flex flex-col select-none"
          style={{ width: SIDEBAR_WIDTH }}
        >
          {/* Header */}
          <div
            className="px-4 border-b border-neutral-200 font-bold text-xs uppercase tracking-wider text-neutral-600 flex items-center justify-between bg-neutral-100/90"
            style={{ height: HEADER_HEIGHT }}
          >
            <span>Tarefas do Escritório ({tasks.length})</span>
            <span className="text-[10px] font-mono font-semibold text-neutral-400">Responsável</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-neutral-200/70 overflow-hidden">
            {tasks.map((task, idx) => {
              const project = getProject(task.projectId);
              const member = getMember(task.responsibleId);
              const isHovered = hoveredTaskId === task.id;
              const isDraggingThis = dragState?.taskId === task.id;

              return (
                <div
                  key={task.id}
                  style={{ height: ROW_HEIGHT }}
                  onMouseEnter={() => setHoveredTaskId(task.id)}
                  onMouseLeave={() => setHoveredTaskId(null)}
                  onClick={() => onEditTask(task)}
                  className={`px-3 flex items-center justify-between gap-2 transition-colors cursor-pointer group ${
                    isDraggingThis
                      ? 'bg-amber-100/70'
                      : isHovered
                      ? 'bg-amber-50/50'
                      : idx % 2 === 0
                      ? 'bg-white'
                      : 'bg-neutral-50/40'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      {project && (
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onSelectProject) onSelectProject(project.id);
                          }}
                          className="px-1.5 py-0.2 text-[9px] font-mono font-bold rounded-xs bg-stone-200 text-stone-800 hover:bg-stone-300"
                        >
                          {project.code}
                        </span>
                      )}
                      <h5 className="text-xs font-semibold text-neutral-900 truncate group-hover:text-amber-900">
                        {task.title}
                      </h5>
                    </div>
                    <div className="text-[10px] font-mono text-neutral-500 truncate flex items-center gap-1.5 mt-0.5">
                      <span>{task.startDate.slice(5)}</span>
                      <span>→</span>
                      <span>{task.endDate.slice(5)}</span>
                    </div>
                  </div>

                  {member && (
                    <div
                      className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center font-bold text-[10px] shadow-2xs ${member.avatarColor}`}
                      title={`${member.name} (${member.role})`}
                    >
                      {member.initials}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: D3 Canvas with horizontal scroll */}
        <div
          ref={containerRef}
          className="flex-1 overflow-x-auto overflow-y-hidden bg-neutral-100/40 relative"
        >
          <svg
            ref={svgRef}
            width={timelineWidth}
            height={totalHeight}
            className="select-none"
          >
            <defs>
              {/* Pattern for weekend shading */}
              <pattern id="weekendStripe" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="8" stroke="#E2E8F0" strokeWidth="1.5" />
              </pattern>

              {/* Task bar shadow */}
              <filter id="taskShadow" x="-10%" y="-10%" width="120%" height="130%">
                <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.1" />
              </filter>
            </defs>

            {/* 1. Header Background */}
            <rect x="0" y="0" width={timelineWidth} height={HEADER_HEIGHT} fill="#F8FAFC" />
            <line x1="0" y1={HEADER_HEIGHT} x2={timelineWidth} y2={HEADER_HEIGHT} stroke="#E2E8F0" strokeWidth="1" />

            {/* 2. Month Headers */}
            {calendarTicks.months.map((m, i) => (
              <g key={`month-${i}`} transform={`translate(${m.x}, 0)`}>
                <line x1="0" y1="0" x2="0" y2={HEADER_HEIGHT} stroke="#CBD5E1" strokeWidth="1.5" />
                <text
                  x="8"
                  y="18"
                  fill="#0F172A"
                  fontSize="11"
                  fontWeight="bold"
                  className="uppercase tracking-wider font-sans"
                >
                  {m.label}
                </text>
              </g>
            ))}

            {/* 3. Day Columns & Weekend Grid */}
            {calendarTicks.days.map((d, i) => {
              return (
                <g key={`day-${i}`} transform={`translate(${d.x}, 0)`}>
                  {/* Weekend Column shading across the whole chart */}
                  {d.isWeekend && (
                    <rect
                      x="0"
                      y={HEADER_HEIGHT}
                      width={dayWidth}
                      height={totalHeight - HEADER_HEIGHT}
                      fill="#F1F5F9"
                      opacity="0.6"
                    />
                  )}

                  {/* Vertical grid line */}
                  <line
                    x1="0"
                    y1={d.isMonday ? 22 : HEADER_HEIGHT}
                    x2="0"
                    y2={totalHeight}
                    stroke={d.isMonday ? '#CBD5E1' : '#F1F5F9'}
                    strokeWidth={d.isMonday ? '1' : '0.8'}
                  />

                  {/* Day number in header */}
                  <text
                    x={dayWidth / 2}
                    y={38}
                    textAnchor="middle"
                    fill={d.isWeekend ? '#94A3B8' : '#334155'}
                    fontSize={zoomLevel === 'compact' ? '9' : '10'}
                    fontWeight={d.isMonday ? 'bold' : 'normal'}
                    fontFamily="monospace"
                  >
                    {d.dayNum}
                  </text>
                </g>
              );
            })}

            {/* 4. Horizontal Row Backgrounds & Dividers */}
            {tasks.map((task, idx) => {
              const y = HEADER_HEIGHT + idx * ROW_HEIGHT;
              const isHovered = hoveredTaskId === task.id;
              const isDraggingThis = dragState?.taskId === task.id;

              return (
                <g key={`row-${task.id}`}>
                  <rect
                    x="0"
                    y={y}
                    width={timelineWidth}
                    height={ROW_HEIGHT}
                    fill={
                      isDraggingThis
                        ? '#FEF3C7'
                        : isHovered
                        ? '#F8FAFC'
                        : idx % 2 === 0
                        ? '#FFFFFF'
                        : '#FAFAFA'
                    }
                    opacity="0.9"
                  />
                  <line
                    x1="0"
                    y1={y + ROW_HEIGHT}
                    x2={timelineWidth}
                    y2={y + ROW_HEIGHT}
                    stroke="#E2E8F0"
                    strokeWidth="0.8"
                  />
                </g>
              );
            })}

            {/* 5. Today Vertical Indicator Line */}
            {todayX !== null && (
              <g transform={`translate(${todayX}, 0)`} className="pointer-events-none z-30">
                <line
                  x1="0"
                  y1={0}
                  x2="0"
                  y2={totalHeight}
                  stroke="#E11D48"
                  strokeWidth="2"
                  strokeDasharray="4 3"
                />
                <rect x="-18" y="4" width="36" height="16" rx="4" fill="#E11D48" />
                <text x="0" y="15" fill="#FFFFFF" fontSize="9" fontWeight="bold" textAnchor="middle">
                  HOJE
                </text>
              </g>
            )}

            {/* 6. Interactive Task Bars (D3 Drag targets) */}
            {tasks.map((task, idx) => {
              const y = HEADER_HEIGHT + idx * ROW_HEIGHT + 7;
              const barHeight = ROW_HEIGHT - 14;

              // If dragging this task, use live preview dates
              const isDraggingThis = dragState?.taskId === task.id;
              const activeStart = isDraggingThis ? dragState.currentStartDate : task.startDate;
              const activeEnd = isDraggingThis ? dragState.currentEndDate : task.endDate;

              const startX = dateToX(activeStart);
              const endX = dateToX(activeEnd);
              const width = Math.max(endX - startX + dayWidth, 24);

              const color = getPhaseColor(task.phase);
              const isHovered = hoveredTaskId === task.id;
              const member = getMember(task.responsibleId);

              return (
                <g
                  key={`task-bar-${task.id}`}
                  className="d3-task-bar-group cursor-grab active:cursor-grabbing transition-opacity"
                  data-start-x={startX}
                  opacity={isDraggingThis ? 0.95 : 1}
                  onMouseEnter={() => setHoveredTaskId(task.id)}
                  onMouseLeave={() => setHoveredTaskId(null)}
                >
                  {/* Original Ghost bar while dragging */}
                  {isDraggingThis && (
                    <rect
                      x={dateToX(task.startDate)}
                      y={y}
                      width={Math.max(dateToX(task.endDate) - dateToX(task.startDate) + dayWidth, 24)}
                      height={barHeight}
                      rx="6"
                      fill="none"
                      stroke="#94A3B8"
                      strokeWidth="1.5"
                      strokeDasharray="4 3"
                      opacity="0.6"
                    />
                  )}

                  {/* Main Task Body Bar (draggable) */}
                  <g className="d3-task-body">
                    <rect
                      x={startX}
                      y={y}
                      width={width}
                      height={barHeight}
                      rx="6"
                      fill={color}
                      filter="url(#taskShadow)"
                      className="transition-all hover:brightness-105"
                    />

                    {/* Progress overlay if task is completed */}
                    {task.completed && (
                      <rect
                        x={startX}
                        y={y}
                        width={width}
                        height={barHeight}
                        rx="6"
                        fill="#059669"
                        opacity="0.3"
                      />
                    )}

                    {/* Left accent border */}
                    <rect
                      x={startX}
                      y={y}
                      width="4"
                      height={barHeight}
                      rx="2"
                      fill="#FFFFFF"
                      opacity="0.6"
                    />

                    {/* Label inside bar */}
                    <text
                      x={startX + 10}
                      y={y + barHeight / 2 + 4}
                      fill="#FFFFFF"
                      fontSize="11"
                      fontWeight="bold"
                      className="pointer-events-none select-none font-sans"
                    >
                      {width > 80 ? (
                        task.title.length > Math.floor(width / 7)
                          ? `${task.title.slice(0, Math.floor(width / 7))}...`
                          : task.title
                      ) : (
                        ''
                      )}
                    </text>

                    {/* Days duration badge on right of bar */}
                    {width > 120 && (
                      <text
                        x={startX + width - 10}
                        y={y + barHeight / 2 + 3.5}
                        fill="#FFFFFF"
                        fontSize="9.5"
                        fontWeight="semibold"
                        textAnchor="end"
                        opacity="0.9"
                        className="pointer-events-none font-mono"
                      >
                        {activeStart.slice(5)} → {activeEnd.slice(5)}
                      </text>
                    )}
                  </g>

                  {/* LEFT RESIZE HANDLE (Puxe para alterar início) */}
                  <rect
                    className="d3-handle-left cursor-ew-resize hover:fill-amber-300"
                    x={startX - 2}
                    y={y}
                    width="8"
                    height={barHeight}
                    rx="3"
                    fill={isHovered || isDraggingThis ? '#F59E0B' : 'transparent'}
                    opacity={isHovered || isDraggingThis ? 0.9 : 0}
                  />

                  {/* RIGHT RESIZE HANDLE (Puxe para alterar término) */}
                  <rect
                    className="d3-handle-right cursor-ew-resize hover:fill-amber-300"
                    x={startX + width - 6}
                    y={y}
                    width="8"
                    height={barHeight}
                    rx="3"
                    fill={isHovered || isDraggingThis ? '#F59E0B' : 'transparent'}
                    opacity={isHovered || isDraggingThis ? 0.9 : 0}
                  />

                  {/* Floating Date Bubble while dragging or hovering */}
                  {(isDraggingThis || (isHovered && !dragState)) && (
                    <g
                      transform={`translate(${startX + width / 2}, ${y - 8})`}
                      className="pointer-events-none z-50 animate-in fade-in zoom-in-95 duration-100"
                    >
                      <rect
                        x="-60"
                        y="-22"
                        width="120"
                        height="20"
                        rx="5"
                        fill="#0F172A"
                        opacity="0.95"
                      />
                      <polygon points="-4,-2 4,-2 0,2" fill="#0F172A" />
                      <text
                        x="0"
                        y="-9"
                        fill="#FFFFFF"
                        fontSize="9.5"
                        fontWeight="bold"
                        textAnchor="middle"
                        fontFamily="monospace"
                      >
                        {activeStart.slice(5)} ➔ {activeEnd.slice(5)}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Footer Instructions & Legend */}
      <div className="p-3 bg-neutral-50 border-t border-neutral-200 flex flex-wrap items-center justify-between text-xs text-neutral-600 gap-3">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="w-3 h-3 rounded-xs bg-[#4F46E5]" />
            <span>Plantas & Layout</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="w-3 h-3 rounded-xs bg-[#0EA5E9]" />
            <span>Complementares</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="w-3 h-3 rounded-xs bg-[#EAB308]" />
            <span>Condomínio</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="w-3 h-3 rounded-xs bg-[#EF4444]" />
            <span>Seguros & RC</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-stone-500 font-medium text-[11px]">
          <Info className="w-3.5 h-3.5 text-amber-600" />
          <span>Dica: Arraste a barra para mover no calendário ou use as bordas laterais para alterar a duração.</span>
        </div>
      </div>
    </div>
  );
};
