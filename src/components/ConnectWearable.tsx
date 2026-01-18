'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Loader2, X, RefreshCw } from 'lucide-react';
import { TERRA_PROVIDERS } from '@/lib/terra';

interface ConnectedDevice {
  terraUserId: string;
  provider: string;
  providerInfo: {
    id: string;
    name: string;
    icon: string;
  };
  lastSync: string | null;
}

interface ConnectWearableProps {
  userId: string;
  onConnectionChange?: () => void;
}

export default function ConnectWearable({ userId, onConnectionChange }: ConnectWearableProps) {
  const [devices, setDevices] = useState<ConnectedDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchDevices = useCallback(async () => {
    try {
      const response = await fetch(`/api/terra/users?userId=${encodeURIComponent(userId)}`);
      if (response.ok) {
        const data = await response.json();
        setDevices(data.devices || []);
      }
    } catch (err) {
      console.error('Error fetching devices:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  // Check for connection status in URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const terraStatus = params.get('terra');

    if (terraStatus === 'connected') {
      // Refresh devices list after successful connection
      fetchDevices();
      onConnectionChange?.();
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (terraStatus === 'failed') {
      setError('Failed to connect device. Please try again.');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [fetchDevices, onConnectionChange]);

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const response = await fetch('/api/terra/widget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to create connection session');
      }

      const data = await response.json();

      // Redirect to Terra widget
      window.location.href = data.url;
    } catch (err) {
      console.error('Error connecting device:', err);
      setError('Failed to start connection. Please try again.');
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async (terraUserId: string) => {
    setDisconnectingId(terraUserId);
    setError(null);

    try {
      const response = await fetch('/api/terra/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ terraUserId }),
      });

      if (!response.ok) {
        throw new Error('Failed to disconnect device');
      }

      // Remove from local state
      setDevices(prev => prev.filter(d => d.terraUserId !== terraUserId));
      onConnectionChange?.();
    } catch (err) {
      console.error('Error disconnecting device:', err);
      setError('Failed to disconnect device. Please try again.');
    } finally {
      setDisconnectingId(null);
    }
  };

  const getProviderIcon = (provider: string) => {
    const info = TERRA_PROVIDERS.find(p => p.id === provider.toUpperCase());
    return info?.name || provider;
  };

  const formatLastSync = (lastSync: string | null) => {
    if (!lastSync) return 'Never synced';
    const date = new Date(lastSync);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-[#B5AFA8] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-2xl text-sm">
          {error}
        </div>
      )}

      {/* Connected Devices */}
      {devices.length > 0 && (
        <div className="space-y-3">
          {devices.map((device) => (
            <div
              key={device.terraUserId}
              className="flex items-center justify-between bg-[#F5EDE4] rounded-2xl px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                  <span className="text-lg">
                    {device.provider.toUpperCase() === 'OURA' && '💍'}
                    {device.provider.toUpperCase() === 'WHOOP' && '⌚'}
                    {device.provider.toUpperCase() === 'GARMIN' && '⌚'}
                    {device.provider.toUpperCase() === 'FITBIT' && '⌚'}
                    {device.provider.toUpperCase() === 'APPLE' && '🍎'}
                    {device.provider.toUpperCase() === 'GOOGLE' && '📱'}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-[#2D2A26]">
                    {device.providerInfo?.name || device.provider}
                  </p>
                  <p className="text-sm text-[#B5AFA8]">
                    {formatLastSync(device.lastSync)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDisconnect(device.terraUserId)}
                disabled={disconnectingId === device.terraUserId}
                className="p-2 text-[#B5AFA8] hover:text-red-500 transition-colors disabled:opacity-50"
                title="Disconnect"
              >
                {disconnectingId === device.terraUserId ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <X className="w-5 h-5" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Connect Button */}
      <button
        onClick={handleConnect}
        disabled={isConnecting}
        className="w-full flex items-center justify-center gap-2 bg-[#E07A5F] text-white rounded-2xl px-4 py-3 font-medium hover:bg-[#D36B4F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isConnecting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <Plus className="w-5 h-5" />
            Connect {devices.length > 0 ? 'Another ' : ''}Device
          </>
        )}
      </button>

      {/* Supported Devices */}
      <p className="text-center text-sm text-[#B5AFA8]">
        Oura · Whoop · Garmin · Fitbit · Apple Health · Google Fit
      </p>

      {/* Refresh Button */}
      {devices.length > 0 && (
        <button
          onClick={fetchDevices}
          className="w-full flex items-center justify-center gap-2 text-[#B5AFA8] hover:text-[#2D2A26] transition-colors text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      )}
    </div>
  );
}
