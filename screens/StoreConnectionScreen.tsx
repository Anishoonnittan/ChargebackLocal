import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

type Platform = 'shopify' | 'woocommerce' | 'api' | null;

interface StoreConnectionScreenProps {
  onBack: () => void;
  onConnected?: () => void;
}

export default function StoreConnectionScreen({
  onBack,
  onConnected,
}: StoreConnectionScreenProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>(null);
  const [connecting, setConnecting] = useState(false);
  const [enableAutoScan, setEnableAutoScan] = useState(true);

  // Shopify fields
  const [shopifyDomain, setShopifyDomain] = useState('');
  const [shopifyApiKey, setShopifyApiKey] = useState('');
  const [shopifyPassword, setShopifyPassword] = useState('');

  // WooCommerce fields
  const [wooUrl, setWooUrl] = useState('');
  const [wooConsumerKey, setWooConsumerKey] = useState('');
  const [wooConsumerSecret, setWooConsumerSecret] = useState('');

  // Custom API fields
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [apiKey, setApiKey] = useState('');

  const handleConnect = async () => {
    if (!selectedPlatform) {
      Alert.alert('Error', 'Please select a platform');
      return;
    }

    // Validate fields
    if (selectedPlatform === 'shopify') {
      if (!shopifyDomain || !shopifyApiKey || !shopifyPassword) {
        Alert.alert('Error', 'Please fill in all Shopify fields');
        return;
      }
    } else if (selectedPlatform === 'woocommerce') {
      if (!wooUrl || !wooConsumerKey || !wooConsumerSecret) {
        Alert.alert('Error', 'Please fill in all WooCommerce fields');
        return;
      }
    } else if (selectedPlatform === 'api') {
      if (!apiEndpoint || !apiKey) {
        Alert.alert('Error', 'Please fill in all API fields');
        return;
      }
    }

    setConnecting(true);

    try {
      // TODO: Call Convex mutation to save store connection
      // await saveStoreConnection({ platform, credentials, enableAutoScan })

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      Alert.alert(
        'Success',
        `Store connected successfully! ${
          enableAutoScan
            ? 'Automatic scanning is now enabled.'
            : 'You can enable automatic scanning in Configuration.'
        }`,
        [
          {
            text: 'OK',
            onPress: () => {
              onConnected?.();
              onBack();
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to connect store. Please try again.');
    } finally {
      setConnecting(false);
    }
  };

  const renderPlatformSelector = () => (
    <View style={styles.platformSelector}>
      <Text style={styles.sectionTitle}>Select Platform</Text>

      <TouchableOpacity
        style={[
          styles.platformCard,
          selectedPlatform === 'shopify' && styles.platformCardSelected,
        ]}
        onPress={() => setSelectedPlatform('shopify')}
      >
        <Ionicons
          name="bag-outline"
          size={32}
          color={selectedPlatform === 'shopify' ? '#009688' : '#666'}
        />
        <View style={styles.platformInfo}>
          <Text style={styles.platformName}>Shopify</Text>
          <Text style={styles.platformDesc}>
            Connect your Shopify store
          </Text>
        </View>
        {selectedPlatform === 'shopify' && (
          <Ionicons name="checkmark-circle" size={24} color="#009688" />
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.platformCard,
          selectedPlatform === 'woocommerce' && styles.platformCardSelected,
        ]}
        onPress={() => setSelectedPlatform('woocommerce')}
      >
        <Ionicons
          name="cart-outline"
          size={32}
          color={selectedPlatform === 'woocommerce' ? '#009688' : '#666'}
        />
        <View style={styles.platformInfo}>
          <Text style={styles.platformName}>WooCommerce</Text>
          <Text style={styles.platformDesc}>
            Connect your WordPress store
          </Text>
        </View>
        {selectedPlatform === 'woocommerce' && (
          <Ionicons name="checkmark-circle" size={24} color="#009688" />
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.platformCard,
          selectedPlatform === 'api' && styles.platformCardSelected,
        ]}
        onPress={() => setSelectedPlatform('api')}
      >
        <Ionicons
          name="code-outline"
          size={32}
          color={selectedPlatform === 'api' ? '#009688' : '#666'}
        />
        <View style={styles.platformInfo}>
          <Text style={styles.platformName}>Custom API</Text>
          <Text style={styles.platformDesc}>
            Connect via REST API
          </Text>
        </View>
        {selectedPlatform === 'api' && (
          <Ionicons name="checkmark-circle" size={24} color="#009688" />
        )}
      </TouchableOpacity>
    </View>
  );

  const renderShopifyForm = () => (
    <View style={styles.formContainer}>
      <Text style={styles.sectionTitle}>Shopify Credentials</Text>

      <Text style={styles.label}>Store Domain</Text>
      <TextInput
        style={styles.input}
        placeholder="mystore.myshopify.com"
        value={shopifyDomain}
        onChangeText={setShopifyDomain}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <Text style={styles.label}>API Key</Text>
      <TextInput
        style={styles.input}
        placeholder="Your Shopify API Key"
        value={shopifyApiKey}
        onChangeText={setShopifyApiKey}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <Text style={styles.label}>API Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Your Shopify API Password"
        value={shopifyPassword}
        onChangeText={setShopifyPassword}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
      />

      <TouchableOpacity style={styles.helpButton}>
        <Ionicons name="help-circle-outline" size={20} color="#009688" />
        <Text style={styles.helpText}>How to get Shopify credentials?</Text>
      </TouchableOpacity>
    </View>
  );

  const renderWooCommerceForm = () => (
    <View style={styles.formContainer}>
      <Text style={styles.sectionTitle}>WooCommerce Credentials</Text>

      <Text style={styles.label}>Store URL</Text>
      <TextInput
        style={styles.input}
        placeholder="https://mystore.com"
        value={wooUrl}
        onChangeText={setWooUrl}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <Text style={styles.label}>Consumer Key</Text>
      <TextInput
        style={styles.input}
        placeholder="ck_xxxxxxxxxxxxx"
        value={wooConsumerKey}
        onChangeText={setWooConsumerKey}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <Text style={styles.label}>Consumer Secret</Text>
      <TextInput
        style={styles.input}
        placeholder="cs_xxxxxxxxxxxxx"
        value={wooConsumerSecret}
        onChangeText={setWooConsumerSecret}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
      />

      <TouchableOpacity style={styles.helpButton}>
        <Ionicons name="help-circle-outline" size={20} color="#009688" />
        <Text style={styles.helpText}>How to get WooCommerce credentials?</Text>
      </TouchableOpacity>
    </View>
  );

  const renderAPIForm = () => (
    <View style={styles.formContainer}>
      <Text style={styles.sectionTitle}>Custom API Credentials</Text>

      <Text style={styles.label}>Webhook Endpoint</Text>
      <TextInput
        style={styles.input}
        placeholder="https://api.yourstore.com/webhook"
        value={apiEndpoint}
        onChangeText={setApiEndpoint}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <Text style={styles.label}>API Key</Text>
      <TextInput
        style={styles.input}
        placeholder="Your API Key"
        value={apiKey}
        onChangeText={setApiKey}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <TouchableOpacity style={styles.helpButton}>
        <Ionicons name="help-circle-outline" size={20} color="#009688" />
        <Text style={styles.helpText}>View API documentation</Text>
      </TouchableOpacity>
    </View>
  );

  const renderAutoScanToggle = () => (
    <View style={styles.autoScanContainer}>
      <View style={styles.autoScanHeader}>
        <Ionicons name="scan-outline" size={24} color="#009688" />
        <Text style={styles.autoScanTitle}>Enable Automatic Scanning</Text>
      </View>
      <Text style={styles.autoScanDesc}>
        Automatically scan new orders when they arrive from your connected store.
        You can change this later in Configuration.
      </Text>
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>
          {enableAutoScan ? 'Enabled' : 'Disabled'}
        </Text>
        <Switch
          value={enableAutoScan}
          onValueChange={setEnableAutoScan}
          trackColor={{ false: '#ccc', true: '#009688' }}
          thumbColor="#fff"
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Connect Store</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderPlatformSelector()}

        {selectedPlatform === 'shopify' && renderShopifyForm()}
        {selectedPlatform === 'woocommerce' && renderWooCommerceForm()}
        {selectedPlatform === 'api' && renderAPIForm()}

        {selectedPlatform && renderAutoScanToggle()}

        {selectedPlatform && (
          <TouchableOpacity
            style={[styles.connectButton, connecting && styles.connectButtonDisabled]}
            onPress={handleConnect}
            disabled={connecting}
          >
            {connecting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="link-outline" size={20} color="#fff" />
                <Text style={styles.connectButtonText}>Connect Store</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  platformSelector: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  platformCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  platformCardSelected: {
    borderColor: '#009688',
    backgroundColor: '#e0f2f1',
  },
  platformInfo: {
    flex: 1,
    marginLeft: 12,
  },
  platformName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  platformDesc: {
    fontSize: 14,
    color: '#666',
  },
  formContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  helpText: {
    fontSize: 14,
    color: '#009688',
    marginLeft: 6,
  },
  autoScanContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  autoScanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  autoScanTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  autoScanDesc: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#009688',
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
  },
  connectButtonDisabled: {
    opacity: 0.6,
  },
  connectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
});