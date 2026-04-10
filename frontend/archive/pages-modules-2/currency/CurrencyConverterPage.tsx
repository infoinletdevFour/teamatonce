import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun, ArrowRightLeft, Sheet, BarChart, Bell } from 'lucide-react';
import Icon from '@mdi/react';
import { mdiBell } from '@mdi/js';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card } from '../../components/ui/card';
import CurrencyConverter from '../../components/currency-converter/CurrencyConverter';
import RatesTab from '../../components/currency-converter/RatesTab';
import ChartsTab from '../../components/currency-converter/ChartsTab';
import AlertsTab from '../../components/currency-converter/AlertsTab';
import { MonetizationOn, Close } from '@mui/icons-material';

type Tab = 'convert' | 'rates' | 'charts' | 'alerts';

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
}

const CurrencyConverterPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>('convert');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize notifications - data should come from API
    setNotifications([]);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'convert':
        return <CurrencyConverter />;
      case 'rates':
        return <RatesTab />;
      case 'charts':
        return <ChartsTab />;
      case 'alerts':
        return <AlertsTab />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <MonetizationOn className="h-6 w-6 text-primary" />
              <span className="text-xl font-semibold text-gray-900 dark:text-white">Currency Solution</span>
            </div>
            <div className="flex items-center gap-4">
              {/* Notification Bell */}
              <div className="relative" ref={notificationRef}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowNotifications(!showNotifications)}
                  aria-label="View notifications"
                  className="relative"
                >
                  <Icon path={mdiBell} size={0.8} />
                  {notifications.length > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-5 w-5 text-xs p-0 flex items-center justify-center"
                    >
                      {notifications.length > 9 ? '9+' : notifications.length}
                    </Badge>
                  )}
                </Button>
                
                {/* Notification Dropdown */}
                {showNotifications && (
                  <div className="fixed inset-0 z-50" onClick={() => setShowNotifications(false)}>
                    <div className="absolute top-16 right-4 w-80" onClick={(e) => e.stopPropagation()}>
                      <Card className="p-0 bg-card border shadow-lg">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b">
                          <div className="flex items-center gap-2">
                            <Icon path={mdiBell} size={0.8} style={{ color: 'rgb(71, 189, 255)' }} />
                            <h3 className="font-semibold text-foreground">Notifications</h3>
                            {notifications.length > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {notifications.length}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {notifications.length > 0 && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setNotifications([])}
                                className="h-6 px-2 text-xs hover:bg-primary/10"
                                style={{ color: 'rgb(71, 189, 255)' }}
                              >
                                Mark all read
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setShowNotifications(false)}
                              className="h-6 w-6 p-0"
                            >
                              <Close className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Notifications List */}
                        <div className="max-h-96 overflow-y-auto">
                          {notifications.length > 0 ? (
                            notifications.slice(0, 5).map((notification) => (
                              <div
                                key={notification.id}
                                className={`p-3 border-b hover:bg-secondary/20 transition-colors bg-primary/5 border-l-2 border-l-primary`}
                              >
                                <div className="flex items-start gap-3">
                                  <div className={`p-1.5 rounded-lg flex-shrink-0 bg-primary/10`}>
                                    <MonetizationOn className="h-5 w-5" />
                                  </div>
                                  
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                      <p className="text-sm font-medium truncate text-foreground">
                                        {notification.title}
                                      </p>
                                      <span className="text-xs text-muted-foreground ml-2">
                                        {notification.time}
                                      </span>
                                    </div>
                                    
                                    <p className="text-xs mb-2 text-foreground">
                                      {notification.message}
                                    </p>
                                    
                                    <div className="flex items-center gap-1">
                                      <Button
                                        size="sm"
                                        onClick={() => dismissNotification(notification.id)}
                                        className="h-5 px-2 text-xs bg-emerald-500 hover:bg-emerald-600 text-white"
                                      >
                                        ✓ Read
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => dismissNotification(notification.id)}
                                        className="h-5 px-2 text-xs hover:bg-destructive/10 hover:text-destructive"
                                      >
                                        Delete
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="p-6 text-center">
                              <Icon path={mdiBell} size={1.5} className="text-muted-foreground/50 mx-auto mb-3" />
                              <p className="text-sm text-muted-foreground">No notifications</p>
                            </div>
                          )}
                        </div>
                      </Card>
                    </div>
                  </div>
                )}
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                aria-label="Toggle theme"
              >
                {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </Button>
              <Button variant="outline" onClick={() => navigate('/')}>
                Back to Home
              </Button>
            </div>
          </div>
        </nav>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 -mb-px">
            <button
              onClick={() => setActiveTab('convert')}
              className={`flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'convert'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <ArrowRightLeft className="h-5 w-5" />
              Convert
            </button>
            <button
              onClick={() => setActiveTab('rates')}
              className={`flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'rates'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <Sheet className="h-5 w-5" />
              Rates
            </button>
            <button
              onClick={() => setActiveTab('charts')}
              className={`flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'charts'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <BarChart className="h-5 w-5" />
              Charts
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              className={`flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'alerts'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <Bell className="h-5 w-5" />
              Alerts
            </button>
          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderTabContent()}
      </main>
    </div>
  );
};

export default CurrencyConverterPage;