import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  useColorScheme,
} from 'react-native';
import { User, Shield, Bell, Database, Download, CircleHelp as HelpCircle, LogOut, Moon, Lock, Globe, Archive } from 'lucide-react-native';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [autoSync, setAutoSync] = useState(false);
  const [secureMode, setSecureMode] = useState(true);

  // Dynamic styles based on theme
  const dynamicStyles = {
    container: {
      backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
    },
    header: {
      backgroundColor: isDarkMode ? '#1e293b' : '#f8faf9',
    },
    title: {
      color: isDarkMode ? '#f1f5f9' : '#0f172a',
    },
    subtitle: {
      color: '#64748b',
    },
    sectionTitle: {
      color: isDarkMode ? '#f1f5f9' : '#0f172a',
    },
    settingItem: {
      backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
      borderColor: isDarkMode ? '#334155' : '#e2e8f0',
    },
    settingTitle: {
      color: isDarkMode ? '#f1f5f9' : '#0f172a',
    },
    logoutButton: {
      backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
      borderColor: isDarkMode ? '#ef444420' : '#ef444420',
    },
  };

  const primaryIconColor = isDarkMode ? '#f59e0b' : '#15803d';
  const switchTrackColor = { false: isDarkMode ? '#374151' : '#e2e8f0', true: primaryIconColor };
  const switchThumbColor = '#ffffff';

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout? This will clear all cached data.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: () => console.log('User logged out') },
      ]
    );
  };

  const handleDataExport = () => {
    Alert.alert(
      'Export Data',
      'Export all investigation data for backup purposes',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Export', onPress: () => console.log('Data export initiated') },
      ]
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will remove all temporary files and cached data. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => console.log('Cache cleared') },
      ]
    );
  };

  const SettingItem = ({ icon, title, subtitle, onPress, rightComponent }: any) => (
    <TouchableOpacity style={[styles.settingItem, dynamicStyles.settingItem]} onPress={onPress}>
      <View style={styles.settingLeft}>
        {icon}
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, dynamicStyles.settingTitle]}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {rightComponent}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={[styles.container, dynamicStyles.container]} showsVerticalScrollIndicator={false}>
      <View style={[styles.header, dynamicStyles.header]}>
        <Text style={[styles.title, dynamicStyles.title]}>Settings</Text>
        <Text style={[styles.subtitle, dynamicStyles.subtitle]}>Configure Application Preferences</Text>
      </View>

      {/* Profile Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Profile</Text>
        <SettingItem
          icon={<User size={20} color={primaryIconColor} />}
          title="Officer Profile"
          subtitle="Manage your account details"
          onPress={() => console.log('Profile pressed')}
        />
      </View>

      {/* Security Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Security</Text>
        <SettingItem
          icon={<Lock size={20} color="#ef4444" />}
          title="Secure Mode"
          subtitle="Enhanced security for sensitive investigations"
          rightComponent={
            <Switch
              value={secureMode}
              onValueChange={setSecureMode}
              trackColor={switchTrackColor}
              thumbColor={switchThumbColor}
            />
          }
        />
        <SettingItem
          icon={<Shield size={20} color="#10b981" />}
          title="Authentication"
          subtitle="Biometric and PIN settings"
          onPress={() => console.log('Authentication settings')}
        />
      </View>

      {/* Application Settings */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Application</Text>
        <SettingItem
          icon={<Bell size={20} color="#3b82f6" />}
          title="Notifications"
          subtitle="Analysis completion alerts"
          rightComponent={
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={switchTrackColor}
              thumbColor={switchThumbColor}
            />
          }
        />
        <SettingItem
          icon={<Moon size={20} color="#8b5cf6" />}
          title="Dark Mode"
          subtitle="Optimized for low-light environments"
          rightComponent={
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={switchTrackColor}
              thumbColor={switchThumbColor}
            />
          }
        />
        <SettingItem
          icon={<Globe size={20} color="#06b6d4" />}
          title="Language"
          subtitle="English (US)"
          onPress={() => console.log('Language settings')}
        />
      </View>

      {/* Data Management */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Data Management</Text>
        <SettingItem
          icon={<Database size={20} color="#10b981" />}
          title="Auto Sync"
          subtitle="Automatically sync with secure servers"
          rightComponent={
            <Switch
              value={autoSync}
              onValueChange={setAutoSync}
              trackColor={switchTrackColor}
              thumbColor={switchThumbColor}
            />
          }
        />
        <SettingItem
          icon={<Download size={20} color="#3b82f6" />}
          title="Export Data"
          subtitle="Backup investigation data"
          onPress={handleDataExport}
        />
        <SettingItem
          icon={<Archive size={20} color="#f59e0b" />}
          title="Clear Cache"
          subtitle="Free up storage space"
          onPress={handleClearCache}
        />
      </View>

      {/* Support */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Support</Text>
        <SettingItem
          icon={<HelpCircle size={20} color="#64748b" />}
          title="Help & Documentation"
          subtitle="User guides and tutorials"
          onPress={() => console.log('Help pressed')}
        />
      </View>

      {/* Account Actions */}
      <View style={styles.section}>
        <TouchableOpacity style={[styles.logoutButton, dynamicStyles.logoutButton]} onPress={handleLogout}>
          <LogOut size={20} color="#ef4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* App Version */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>UFDR Forensic Analysis v1.0.0</Text>
        <Text style={styles.buildText}>Build 2024.01.15</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ef4444',
  },
  versionContainer: {
    alignItems: 'center',
    padding: 20,
  },
  versionText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  buildText: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
  },
});