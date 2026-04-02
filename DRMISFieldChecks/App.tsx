import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

// Types
interface FieldCheck {
  id: string;
  deviceId: string;
  timestamp: number;
  synced: boolean;
  gpsCoordinates: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  assetType: string;
  assetId: string;
  assetName: string;
  council: string;
  roofDamage: {
    condition: string;
    percentage: number;
    notes: string;
  };
  wallDamage: {
    condition: string;
    percentage: number;
    notes: string;
  };
  photos: Array<{
    id: string;
    type: string;
    uri: string;
    timestamp: number;
  }>;
}

const DRMISFieldChecks: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [fieldCheck, setFieldCheck] = useState<Partial<FieldCheck>>({
    assetType: '',
    assetId: '',
    assetName: '',
    council: '',
    roofDamage: { condition: '', percentage: 0, notes: '' },
    wallDamage: { condition: '', percentage: 0, notes: '' },
    photos: [],
    gpsCoordinates: { latitude: 0, longitude: 0, accuracy: 0 }
  });

  const [location, setLocation] = useState<Location.LocationObject | null>(null);

  useEffect(() => {
    getLocationAsync();
  }, []);

  const getLocationAsync = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission to access location was denied');
      return;
    }

    let location = await Location.getCurrentPositionAsync({});
    setLocation(location);
    if (location) {
      setFieldCheck(prev => ({
        ...prev,
        gpsCoordinates: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy || 0
        }
      }));
    }
  };

  const assetTypes = ['Education', 'Health', 'Shelter', 'Infrastructure'];
  const councils = ['Port Vila', 'Luganville', 'Tafea', 'Penama', 'Malampa', 'Shefa'];
  
  const roofDamageOptions = [
    { condition: 'intact', percentage: 0, label: 'Intact', description: 'No visible damage' },
    { condition: 'minor', percentage: 20, label: 'Minor', description: 'Some sheets loose' },
    { condition: 'major', percentage: 60, label: 'Major', description: 'Large sections missing' },
    { condition: 'destroyed', percentage: 100, label: 'Destroyed', description: 'Complete loss' }
  ];

  const wallDamageOptions = [
    { condition: 'intact', percentage: 0, label: 'Intact', description: 'Minor cracks only' },
    { condition: 'minor', percentage: 15, label: 'Minor', description: 'Some holes' },
    { condition: 'major', percentage: 50, label: 'Major', description: 'Partial collapse' },
    { condition: 'destroyed', percentage: 100, label: 'Destroyed', description: 'Complete failure' }
  ];

  const saveFieldCheck = async () => {
    setIsLoading(true);
    try {
      const newFieldCheck: FieldCheck = {
        id: Date.now().toString(),
        deviceId: 'device-001',
        timestamp: Date.now(),
        synced: false,
        gpsCoordinates: fieldCheck.gpsCoordinates || { latitude: 0, longitude: 0, accuracy: 0 },
        assetType: fieldCheck.assetType || '',
        assetId: fieldCheck.assetId || '',
        assetName: fieldCheck.assetName || '',
        council: fieldCheck.council || '',
        roofDamage: fieldCheck.roofDamage || { condition: '', percentage: 0, notes: '' },
        wallDamage: fieldCheck.wallDamage || { condition: '', percentage: 0, notes: '' },
        photos: fieldCheck.photos || []
      };

      await AsyncStorage.setItem('fieldCheck', JSON.stringify(newFieldCheck));
      Alert.alert('Success', 'Field check saved locally!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save field check');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Asset Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Asset Type</Text>
              <View style={styles.pickerContainer}>
                {assetTypes.map((type, index) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.pickerItem,
                      fieldCheck.assetType === type && styles.pickerItemSelected
                    ]}
                    onPress={() => setFieldCheck(prev => ({ ...prev, assetType: type }))}
                  >
                    <Text style={[
                      styles.pickerItemText,
                      fieldCheck.assetType === type && styles.pickerItemTextSelected
                    ]}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Asset ID</Text>
              <TextInput
                style={styles.input}
                value={fieldCheck.assetId || ''}
                onChangeText={(text) => setFieldCheck(prev => ({ ...prev, assetId: text }))}
                placeholder="Enter asset ID"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Asset Name</Text>
              <TextInput
                style={styles.input}
                value={fieldCheck.assetName || ''}
                onChangeText={(text) => setFieldCheck(prev => ({ ...prev, assetName: text }))}
                placeholder="Enter asset name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Area Council</Text>
              <View style={styles.pickerContainer}>
                {councils.map((council, index) => (
                  <TouchableOpacity
                    key={council}
                    style={[
                      styles.pickerItem,
                      fieldCheck.council === council && styles.pickerItemSelected
                    ]}
                    onPress={() => setFieldCheck(prev => ({ ...prev, council }))}
                  >
                    <Text style={[
                      styles.pickerItemText,
                      fieldCheck.council === council && styles.pickerItemTextSelected
                    ]}>{council}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        );

      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>GPS Location</Text>
            
            <View style={styles.locationCard}>
              <View style={styles.locationRow}>
                <Ionicons name="location" size={24} color="#3b82f6" />
                <View style={styles.locationInfo}>
                  <Text style={styles.locationLabel}>Current Location</Text>
                  {location ? (
                    <>
                      <Text style={styles.locationText}>
                        Lat: {location.coords.latitude.toFixed(6)}
                      </Text>
                      <Text style={styles.locationText}>
                        Lon: {location.coords.longitude.toFixed(6)}
                      </Text>
                      <Text style={styles.locationText}>
                        Accuracy: ±{location.coords.accuracy?.toFixed(0)}m
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.locationText}>Location not available</Text>
                  )}
                </View>
              </View>
              
              <TouchableOpacity
                style={styles.locationButton}
                onPress={getLocationAsync}
              >
                <Ionicons name="refresh" size={20} color="white" />
                <Text style={styles.locationButtonText}>Update Location</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Roof Damage Assessment</Text>
            
            <View style={styles.damageGrid}>
              {roofDamageOptions.map((option) => (
                <TouchableOpacity
                  key={option.condition}
                  style={[
                    styles.damageCard,
                    fieldCheck.roofDamage?.condition === option.condition && styles.damageCardSelected
                  ]}
                  onPress={() => setFieldCheck(prev => ({
                    ...prev,
                    roofDamage: {
                      condition: option.condition,
                      percentage: option.percentage,
                      notes: prev.roofDamage?.notes || ''
                    }
                  }))}
                >
                  <Text style={styles.damageLabel}>{option.label}</Text>
                  <Text style={styles.damagePercentage}>{option.percentage}%</Text>
                  <Text style={styles.damageDescription}>{option.description}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Roof Damage Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={fieldCheck.roofDamage?.notes || ''}
                onChangeText={(text) => setFieldCheck(prev => ({
                  ...prev,
                  roofDamage: { ...prev.roofDamage!, notes: text }
                }))}
                placeholder="Enter detailed roof damage observations..."
                multiline
                numberOfLines={4}
              />
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Wall Damage Assessment</Text>
            
            <View style={styles.damageGrid}>
              {wallDamageOptions.map((option) => (
                <TouchableOpacity
                  key={option.condition}
                  style={[
                    styles.damageCard,
                    fieldCheck.wallDamage?.condition === option.condition && styles.damageCardSelected
                  ]}
                  onPress={() => setFieldCheck(prev => ({
                    ...prev,
                    wallDamage: {
                      condition: option.condition,
                      percentage: option.percentage,
                      notes: prev.wallDamage?.notes || ''
                    }
                  }))}
                >
                  <Text style={styles.damageLabel}>{option.label}</Text>
                  <Text style={styles.damagePercentage}>{option.percentage}%</Text>
                  <Text style={styles.damageDescription}>{option.description}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Wall Damage Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={fieldCheck.wallDamage?.notes || ''}
                onChangeText={(text) => setFieldCheck(prev => ({
                  ...prev,
                  wallDamage: { ...prev.wallDamage!, notes: text }
                }))}
                placeholder="Enter detailed wall damage observations..."
                multiline
                numberOfLines={4}
              />
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>DRMIS Field Checks</Text>
        <Text style={styles.headerSubtitle}>Damage Assessment Tool</Text>
      </View>

      <View style={styles.progressContainer}>
        {[0, 1, 2, 3].map((step) => (
          <View
            key={step}
            style={[
              styles.progressDot,
              currentStep >= step && styles.progressDotActive
            ]}
          />
        ))}
      </View>

      <ScrollView style={styles.content}>
        {renderStep()}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary]}
          onPress={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
        >
          <Text style={styles.buttonText}>Previous</Text>
        </TouchableOpacity>

        {currentStep < 3 ? (
          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary]}
            onPress={() => setCurrentStep(currentStep + 1)}
          >
            <Text style={styles.buttonText}>Next</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary]}
            onPress={saveFieldCheck}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.buttonText}>Save Field Check</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#3b82f6',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#dbeafe',
    textAlign: 'center',
    marginTop: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'white',
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 8,
  },
  progressDotActive: {
    backgroundColor: '#3b82f6',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  stepContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pickerItem: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    minWidth: 80,
  },
  pickerItemSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  pickerItemText: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
  },
  pickerItemTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  locationCard: {
    backgroundColor: '#f0f9ff',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationInfo: {
    marginLeft: 12,
    flex: 1,
  },
  locationLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  locationButton: {
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  locationButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  damageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  damageCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    alignItems: 'center',
  },
  damageCardSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  damageLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  damagePercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
    marginBottom: 4,
  },
  damageDescription: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  button: {
    padding: 16,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#3b82f6',
  },
  buttonSecondary: {
    backgroundColor: '#6b7280',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DRMISFieldChecks;
