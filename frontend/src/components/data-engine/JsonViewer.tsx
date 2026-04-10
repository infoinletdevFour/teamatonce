import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Copy, Check } from 'lucide-react';

interface JsonViewerProps {
  data: unknown;
  initialExpanded?: boolean;
  maxDepth?: number;
}

const JsonViewer: React.FC<JsonViewerProps> = ({ data, initialExpanded = true, maxDepth = 4 }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-gray-100">
        <span className="text-xs font-medium text-gray-500">JSON</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div className="p-3 text-sm font-mono overflow-auto max-h-96">
        <JsonNode value={data} depth={0} expanded={initialExpanded} maxDepth={maxDepth} />
      </div>
    </div>
  );
};

interface JsonNodeProps {
  value: unknown;
  depth: number;
  expanded: boolean;
  maxDepth: number;
  keyName?: string;
}

const JsonNode: React.FC<JsonNodeProps> = ({ value, depth, expanded: initialExpanded, maxDepth, keyName }) => {
  const [expanded, setExpanded] = useState(initialExpanded && depth < maxDepth);

  if (value === null) {
    return (
      <span>
        {keyName !== undefined && <span className="text-purple-700">&quot;{keyName}&quot;</span>}
        {keyName !== undefined && <span className="text-gray-500">: </span>}
        <span className="text-gray-400">null</span>
      </span>
    );
  }

  if (typeof value === 'boolean') {
    return (
      <span>
        {keyName !== undefined && <span className="text-purple-700">&quot;{keyName}&quot;</span>}
        {keyName !== undefined && <span className="text-gray-500">: </span>}
        <span className="text-orange-600">{value.toString()}</span>
      </span>
    );
  }

  if (typeof value === 'number') {
    return (
      <span>
        {keyName !== undefined && <span className="text-purple-700">&quot;{keyName}&quot;</span>}
        {keyName !== undefined && <span className="text-gray-500">: </span>}
        <span className="text-blue-600">{value}</span>
      </span>
    );
  }

  if (typeof value === 'string') {
    const truncated = value.length > 100 ? value.slice(0, 100) + '...' : value;
    return (
      <span>
        {keyName !== undefined && <span className="text-purple-700">&quot;{keyName}&quot;</span>}
        {keyName !== undefined && <span className="text-gray-500">: </span>}
        <span className="text-green-700">&quot;{truncated}&quot;</span>
      </span>
    );
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return (
        <span>
          {keyName !== undefined && <span className="text-purple-700">&quot;{keyName}&quot;</span>}
          {keyName !== undefined && <span className="text-gray-500">: </span>}
          <span className="text-gray-500">[]</span>
        </span>
      );
    }

    return (
      <div>
        <span
          onClick={() => setExpanded(!expanded)}
          className="cursor-pointer inline-flex items-center"
        >
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 inline" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-gray-400 inline" />
          )}
          {keyName !== undefined && <span className="text-purple-700">&quot;{keyName}&quot;</span>}
          {keyName !== undefined && <span className="text-gray-500">: </span>}
          <span className="text-gray-500">[{!expanded && `${value.length} items`}]</span>
        </span>
        {expanded && (
          <div className="ml-4 border-l border-gray-200 pl-2">
            {value.map((item, i) => (
              <div key={i}>
                <JsonNode value={item} depth={depth + 1} expanded={depth + 1 < maxDepth} maxDepth={maxDepth} />
                {i < value.length - 1 && <span className="text-gray-400">,</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) {
      return (
        <span>
          {keyName !== undefined && <span className="text-purple-700">&quot;{keyName}&quot;</span>}
          {keyName !== undefined && <span className="text-gray-500">: </span>}
          <span className="text-gray-500">{'{}'}</span>
        </span>
      );
    }

    return (
      <div>
        <span
          onClick={() => setExpanded(!expanded)}
          className="cursor-pointer inline-flex items-center"
        >
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 inline" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-gray-400 inline" />
          )}
          {keyName !== undefined && <span className="text-purple-700">&quot;{keyName}&quot;</span>}
          {keyName !== undefined && <span className="text-gray-500">: </span>}
          <span className="text-gray-500">{'{'}{!expanded && `${entries.length} keys`}{'}'}</span>
        </span>
        {expanded && (
          <div className="ml-4 border-l border-gray-200 pl-2">
            {entries.map(([k, v], i) => (
              <div key={k}>
                <JsonNode value={v} keyName={k} depth={depth + 1} expanded={depth + 1 < maxDepth} maxDepth={maxDepth} />
                {i < entries.length - 1 && <span className="text-gray-400">,</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return <span className="text-gray-500">{String(value)}</span>;
};

export default JsonViewer;
