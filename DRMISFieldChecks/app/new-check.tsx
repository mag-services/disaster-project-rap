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
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { saveFieldCheck, getSettings } from '@/lib/storage';
import { getStoredAssignments, markAssignmentLocalCheckId } from '@/lib/auth';
import {
  AssetType,
  ConstructionType,
  DamageCondition,
  Functionality,
  Priority,
  GpsCoordinates,
  Assignment,
} from '@/lib/types';
import {
  ASSET_TYPE_LABELS,
  CONSTRUCTION_TYPE_LABELS,
  PROVINCES,
  PROVINCE_COUNCILS,
  ROOF_DAMAGE_OPTIONS,
  WALL_DAMAGE_OPTIONS,
  FUNCTIONALITY_OPTIONS,
  PRIORITY_OPTIONS,
  IMMEDIATE_NEEDS_OPTIONS,
} from '@/lib/data';

type FormState = {
  // Step 1 – asset
  assetType: AssetType;
  assetId: string;
  assetName: string;
  educationLevel: 'ecce' | 'primary' | 'secondary' | '';
  constructionType: ConstructionType;
  province: string;
  council: string;
  // Step 2 – location
  gpsCoordinates: GpsCoordinates;
  // Step 3 – damage
  roofCondition: DamageCondition;
  roofNotes: string;
  wallCondition: DamageCondition;
  wallNotes: string;
  // Step 4 – assessment
  functionality: Functionality;
  immediateNeeds: string[];
  priority: Priority;
  // Step 5 – assessor
  assessorName: string;
  assessorId: string;
  teamLead: string;
  weatherConditions: string;
  accessIssues: string;
  additionalNotes: string;
};

const STEPS = [
  'Asset Info',
  'Location',
  'Damage',
  'Assessment',
  'Assessor',
];

const ROOF_PERCENTAGE: Record<DamageCondition, number> = {
  intact: 0,
  minor: 20,
  major: 60,
  destroyed: 100,
};
const WALL_PERCENTAGE: Record<DamageCondition, number> = {
  intact: 0,
  minor: 15,
  major: 50,
  destroyed: 100,
};

export default function NewCheckScreen() {
  const router = useRouter();
  const { assignmentId: assignmentIdParam } = useLocalSearchParams<{ assignmentId?: string }>();
  const assignmentId = assignmentIdParam ? Number(assignmentIdParam) : undefined;

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [provinceModalVisible, setProvinceModalVisible] = useState(false);
  const [councilModalVisible, setCouncilModalVisible] = useState(false);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  /** Lock province + council when driven by an assignment */
  const locationLocked = !!assignment;

  const [form, setForm] = useState<FormState>({
    assetType: 'education',
    assetId: '',
    assetName: '',
    educationLevel: '',
    constructionType: 'wood',
    province: '',
    council: '',
    gpsCoordinates: { latitude: 0, longitude: 0, accuracy: 0 },
    roofCondition: 'intact',
    roofNotes: '',
    wallCondition: 'intact',
    wallNotes: '',
    functionality: 'usable',
    immediateNeeds: [],
    priority: 'medium',
    assessorName: '',
    assessorId: '',
    teamLead: '',
    weatherConditions: '',
    accessIssues: '',
    additionalNotes: '',
  });

  // Pre-fill assessor from settings, and assignment context if launched from one
  useEffect(() => {
    async function init() {
      const [settings, assignments] = await Promise.all([
        getSettings(),
        getStoredAssignments(),
      ]);

      setForm(f => ({
        ...f,
        assessorName: settings.assessorName || f.assessorName,
        assessorId: settings.assessorId || f.assessorId,
        teamLead: settings.teamLead || f.teamLead,
      }));

      if (assignmentId) {
        const found = assignments.find(a => a.id === assignmentId) ?? null;
        setAssignment(found);
        if (found) {
          setForm(f => ({
            ...f,
            assetType: (found.sectorFamily as AssetType) || f.assetType,
            province: found.provinceName || f.province,
            council: found.councilName || f.council,
            priority: found.priority || f.priority,
          }));
        }
      }
    }
    init();
  }, [assignmentId]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm(f => ({ ...f, [key]: value }));

  const getLocation = async () => {
    setGettingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location access is required to record GPS coordinates.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      set('gpsCoordinates', {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        accuracy: loc.coords.accuracy ?? 0,
        altitude: loc.coords.altitude ?? undefined,
      });
    } catch {
      Alert.alert('Error', 'Could not get location. Please try again.');
    } finally {
      setGettingLocation(false);
    }
  };

  const toggleNeed = (need: string) => {
    setForm(f => ({
      ...f,
      immediateNeeds: f.immediateNeeds.includes(need)
        ? f.immediateNeeds.filter(n => n !== need)
        : [...f.immediateNeeds, need],
    }));
  };

  const validateStep = (): string | null => {
    if (step === 0) {
      if (!form.assetId.trim()) return 'Asset ID is required.';
      if (!form.assetName.trim()) return 'Asset name is required.';
      if (!form.province) return 'Please select a Province.';
      if (!form.council) return 'Please select an Area Council.';
    }
    if (step === 4) {
      if (!form.assessorName.trim()) return 'Assessor name is required.';
      if (!form.assessorId.trim()) return 'Assessor ID is required.';
    }
    return null;
  };

  const handleNext = () => {
    const err = validateStep();
    if (err) { Alert.alert('Missing Info', err); return; }
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    const err = validateStep();
    if (err) { Alert.alert('Missing Info', err); return; }
    setSaving(true);
    try {
      const saved = await saveFieldCheck({
        assetType: form.assetType,
        assetId: form.assetId.trim(),
        assetName: form.assetName.trim(),
        educationLevel: form.educationLevel || undefined,
        constructionType: form.constructionType,
        province: form.province,
        council: form.council,
        gpsCoordinates: form.gpsCoordinates,
        roofDamage: {
          condition: form.roofCondition,
          percentage: ROOF_PERCENTAGE[form.roofCondition],
          notes: form.roofNotes,
        },
        wallDamage: {
          condition: form.wallCondition,
          percentage: WALL_PERCENTAGE[form.wallCondition],
          notes: form.wallNotes,
        },
        functionality: form.functionality,
        immediateNeeds: form.immediateNeeds,
        priority: form.priority,
        assessorName: form.assessorName.trim(),
        assessorId: form.assessorId.trim(),
        teamLead: form.teamLead.trim() || undefined,
        weatherConditions: form.weatherConditions,
        accessIssues: form.accessIssues,
        additionalNotes: form.additionalNotes,
        photos: [],
        assignmentId,
      });

      // Update local assignment cache so dashboard shows "Draft saved"
      if (assignmentId) {
        await markAssignmentLocalCheckId(assignmentId, saved.id);
      }

      Alert.alert('Saved', 'Field check saved locally. Sync when online to submit to DRMIS.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('Error', 'Failed to save field check.');
    } finally {
      setSaving(false);
    }
  };

  const councils = form.province ? PROVINCE_COUNCILS[form.province] ?? [] : [];

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={88}
    >
      {/* Assignment context banner */}
      {assignment && (
        <View style={styles.assignmentBanner}>
          <Ionicons name="clipboard" size={15} color="#1d4ed8" />
          <View style={styles.assignmentBannerText}>
            <Text style={styles.assignmentBannerTitle}>
              Assignment: {assignment.eventName || 'Field Check'}
            </Text>
            <Text style={styles.assignmentBannerSub}>
              {assignment.councilName} · {assignment.sectorFamily}
              {assignment.estimatedValue != null
                ? ` · RAP est. ${formatValue(assignment.estimatedValue)}`
                : ''}
            </Text>
            {assignment.adminNotes ? (
              <Text style={styles.assignmentBannerNotes} numberOfLines={2}>
                ℹ {assignment.adminNotes}
              </Text>
            ) : null}
          </View>
        </View>
      )}

      {/* Step indicator */}
      <View style={styles.stepBar}>
        {STEPS.map((label, i) => (
          <React.Fragment key={i}>
            <TouchableOpacity
              style={styles.stepItem}
              onPress={() => i < step && setStep(i)}
              disabled={i >= step}
            >
              <View style={[styles.stepDot, i <= step && styles.stepDotActive, i < step && styles.stepDotDone]}>
                {i < step ? (
                  <Ionicons name="checkmark" size={12} color="#fff" />
                ) : (
                  <Text style={[styles.stepNum, i === step && styles.stepNumActive]}>{i + 1}</Text>
                )}
              </View>
              <Text style={[styles.stepLabel, i === step && styles.stepLabelActive]}>{label}</Text>
            </TouchableOpacity>
            {i < STEPS.length - 1 && (
              <View style={[styles.stepLine, i < step && styles.stepLineDone]} />
            )}
          </React.Fragment>
        ))}
      </View>

      <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent}>
        {step === 0 && (
          <Step0
            form={form}
            set={set}
            provinceModalVisible={provinceModalVisible}
            setProvinceModalVisible={setProvinceModalVisible}
            councilModalVisible={councilModalVisible}
            setCouncilModalVisible={setCouncilModalVisible}
            councils={councils}
            locationLocked={locationLocked}
          />
        )}
        {step === 1 && (
          <Step1
            form={form}
            getLocation={getLocation}
            gettingLocation={gettingLocation}
          />
        )}
        {step === 2 && <Step2 form={form} set={set} />}
        {step === 3 && <Step3 form={form} set={set} toggleNeed={toggleNeed} />}
        {step === 4 && <Step4 form={form} set={set} />}
      </ScrollView>

      {/* Footer nav */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.navBtn, styles.prevBtn, step === 0 && styles.navBtnDisabled]}
          onPress={() => setStep(s => s - 1)}
          disabled={step === 0}
        >
          <Ionicons name="chevron-back" size={18} color={step === 0 ? '#d1d5db' : '#374151'} />
          <Text style={[styles.navBtnText, step === 0 && styles.navBtnTextDisabled]}>Back</Text>
        </TouchableOpacity>

        {step < STEPS.length - 1 ? (
          <TouchableOpacity style={[styles.navBtn, styles.nextBtn]} onPress={handleNext}>
            <Text style={styles.nextBtnText}>Next</Text>
            <Ionicons name="chevron-forward" size={18} color="#ffffff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.navBtn, styles.submitBtn, saving && styles.navBtnDisabled]}
            onPress={handleSubmit}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Ionicons name="save-outline" size={18} color="#ffffff" />
            )}
            <Text style={styles.nextBtnText}>{saving ? 'Saving…' : 'Save Check'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Step 0: Asset Info ───────────────────────────────────────────────────────

function Step0({
  form, set, provinceModalVisible, setProvinceModalVisible,
  councilModalVisible, setCouncilModalVisible, councils, locationLocked,
}: any) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Asset Information</Text>

      <Text style={styles.label}>Asset Type</Text>
      <View style={styles.chipRow}>
        {(Object.keys(ASSET_TYPE_LABELS) as AssetType[]).map(t => (
          <Chip
            key={t}
            label={ASSET_TYPE_LABELS[t]}
            selected={form.assetType === t}
            onPress={() => { set('assetType', t); if (t !== 'education') set('educationLevel', ''); }}
          />
        ))}
      </View>

      {form.assetType === 'education' && (
        <>
          <Text style={styles.label}>Education Level</Text>
          <View style={styles.chipRow}>
            {(['ecce', 'primary', 'secondary'] as const).map(l => (
              <Chip key={l} label={l.toUpperCase()} selected={form.educationLevel === l} onPress={() => set('educationLevel', l)} />
            ))}
          </View>
        </>
      )}

      <Text style={styles.label}>Construction Type</Text>
      <View style={styles.chipRow}>
        {(Object.keys(CONSTRUCTION_TYPE_LABELS) as ConstructionType[]).map(c => (
          <Chip key={c} label={CONSTRUCTION_TYPE_LABELS[c]} selected={form.constructionType === c} onPress={() => set('constructionType', c)} />
        ))}
      </View>

      <FormInput label="Asset ID *" value={form.assetId} onChangeText={v => set('assetId', v)} placeholder="e.g. SCH-001" autoCapitalize="characters" />
      <FormInput label="Asset Name *" value={form.assetName} onChangeText={v => set('assetName', v)} placeholder="e.g. Port Vila Primary School" />

      <Text style={styles.label}>Province *</Text>
      <TouchableOpacity
        style={[styles.picker, locationLocked && styles.pickerLocked]}
        onPress={() => !locationLocked && setProvinceModalVisible(true)}
        disabled={locationLocked}
      >
        <Text style={form.province ? styles.pickerText : styles.pickerPlaceholder}>
          {form.province || 'Select Province…'}
        </Text>
        {locationLocked
          ? <Ionicons name="lock-closed" size={15} color="#9ca3af" />
          : <Ionicons name="chevron-down" size={18} color="#6b7280" />}
      </TouchableOpacity>

      <Text style={styles.label}>Area Council *</Text>
      <TouchableOpacity
        style={[styles.picker, (!form.province || locationLocked) && styles.pickerDisabled, locationLocked && styles.pickerLocked]}
        onPress={() => !locationLocked && form.province && setCouncilModalVisible(true)}
        disabled={!form.province || locationLocked}
      >
        <Text style={form.council ? styles.pickerText : styles.pickerPlaceholder}>
          {form.council || (form.province ? 'Select Council…' : 'Select Province first')}
        </Text>
        {locationLocked
          ? <Ionicons name="lock-closed" size={15} color="#9ca3af" />
          : <Ionicons name="chevron-down" size={18} color="#6b7280" />}
      </TouchableOpacity>

      <PickerModal
        visible={provinceModalVisible}
        title="Select Province"
        items={[...PROVINCES]}
        selected={form.province}
        onSelect={v => { set('province', v); set('council', ''); setProvinceModalVisible(false); }}
        onClose={() => setProvinceModalVisible(false)}
      />
      <PickerModal
        visible={councilModalVisible}
        title="Select Area Council"
        items={councils}
        selected={form.council}
        onSelect={v => { set('council', v); setCouncilModalVisible(false); }}
        onClose={() => setCouncilModalVisible(false)}
      />
    </View>
  );
}

// ─── Step 1: GPS Location ─────────────────────────────────────────────────────

function Step1({ form, getLocation, gettingLocation }: any) {
  const hasLocation = form.gpsCoordinates.latitude !== 0 || form.gpsCoordinates.longitude !== 0;
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>GPS Location</Text>
      <Text style={styles.hintText}>
        Tap the button below to capture your current location using the device GPS.
      </Text>

      <View style={[styles.locationBox, hasLocation && styles.locationBoxActive]}>
        <Ionicons name="location" size={28} color={hasLocation ? '#1d4ed8' : '#9ca3af'} />
        {hasLocation ? (
          <View style={styles.locationInfo}>
            <Text style={styles.locationCoord}>Lat: {form.gpsCoordinates.latitude.toFixed(6)}</Text>
            <Text style={styles.locationCoord}>Lon: {form.gpsCoordinates.longitude.toFixed(6)}</Text>
            <Text style={styles.locationAccuracy}>
              Accuracy: ±{form.gpsCoordinates.accuracy.toFixed(0)} m
            </Text>
          </View>
        ) : (
          <Text style={styles.locationPlaceholder}>No location captured</Text>
        )}
      </View>

      <TouchableOpacity
        style={[styles.locationBtn, gettingLocation && styles.navBtnDisabled]}
        onPress={getLocation}
        disabled={gettingLocation}
      >
        {gettingLocation ? (
          <ActivityIndicator color="#ffffff" size="small" />
        ) : (
          <Ionicons name="locate" size={20} color="#ffffff" />
        )}
        <Text style={styles.locationBtnText}>
          {gettingLocation ? 'Getting Location…' : hasLocation ? 'Update Location' : 'Capture Location'}
        </Text>
      </TouchableOpacity>

      {!hasLocation && (
        <Text style={styles.optionalHint}>
          Location is optional but strongly recommended for GIS mapping.
        </Text>
      )}
    </View>
  );
}

// ─── Step 2: Damage Assessment ────────────────────────────────────────────────

function Step2({ form, set }: any) {
  return (
    <View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Roof Damage</Text>
        <View style={styles.damageGrid}>
          {ROOF_DAMAGE_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.condition}
              style={[styles.damageCard, form.roofCondition === opt.condition && styles.damageCardSelected]}
              onPress={() => set('roofCondition', opt.condition)}
            >
              <Text style={styles.damageLabel}>{opt.label}</Text>
              <Text style={[styles.damagePercent, form.roofCondition === opt.condition && styles.damagePercentSelected]}>
                {opt.percentage}%
              </Text>
              <Text style={styles.damageDesc}>{opt.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <FormInput
          label="Notes"
          value={form.roofNotes}
          onChangeText={v => set('roofNotes', v)}
          placeholder="Describe roof damage observations…"
          multiline
        />
      </View>

      <View style={[styles.card, { marginTop: 12 }]}>
        <Text style={styles.cardTitle}>Wall Damage</Text>
        <View style={styles.damageGrid}>
          {WALL_DAMAGE_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.condition}
              style={[styles.damageCard, form.wallCondition === opt.condition && styles.damageCardSelected]}
              onPress={() => set('wallCondition', opt.condition)}
            >
              <Text style={styles.damageLabel}>{opt.label}</Text>
              <Text style={[styles.damagePercent, form.wallCondition === opt.condition && styles.damagePercentSelected]}>
                {opt.percentage}%
              </Text>
              <Text style={styles.damageDesc}>{opt.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <FormInput
          label="Notes"
          value={form.wallNotes}
          onChangeText={v => set('wallNotes', v)}
          placeholder="Describe wall damage observations…"
          multiline
        />
      </View>
    </View>
  );
}

// ─── Step 3: Overall Assessment ───────────────────────────────────────────────

function Step3({ form, set, toggleNeed }: any) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Overall Assessment</Text>

      <Text style={styles.label}>Functionality</Text>
      <View style={styles.chipRow}>
        {FUNCTIONALITY_OPTIONS.map(o => (
          <Chip
            key={o.value}
            label={o.label}
            selected={form.functionality === o.value}
            onPress={() => set('functionality', o.value)}
            selectedColor={o.color}
          />
        ))}
      </View>

      <Text style={styles.label}>Priority</Text>
      <View style={styles.chipRow}>
        {PRIORITY_OPTIONS.map(o => (
          <Chip
            key={o.value}
            label={o.label}
            selected={form.priority === o.value}
            onPress={() => set('priority', o.value)}
            selectedColor={o.color}
          />
        ))}
      </View>

      <Text style={styles.label}>Immediate Needs</Text>
      <Text style={styles.hintText}>Select all that apply.</Text>
      <View style={styles.needsGrid}>
        {IMMEDIATE_NEEDS_OPTIONS.map(need => {
          const selected = form.immediateNeeds.includes(need);
          return (
            <TouchableOpacity
              key={need}
              style={[styles.needChip, selected && styles.needChipSelected]}
              onPress={() => toggleNeed(need)}
            >
              {selected && <Ionicons name="checkmark" size={14} color="#1d4ed8" style={{ marginRight: 4 }} />}
              <Text style={[styles.needChipText, selected && styles.needChipTextSelected]}>
                {need}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Step 4: Assessor & Notes ─────────────────────────────────────────────────

function Step4({ form, set }: any) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Assessor &amp; Notes</Text>

      <FormInput label="Assessor Name *" value={form.assessorName} onChangeText={v => set('assessorName', v)} placeholder="Full name" />
      <FormInput label="Assessor ID *" value={form.assessorId} onChangeText={v => set('assessorId', v)} placeholder="e.g. VAN-ASS-001" autoCapitalize="characters" />
      <FormInput label="Team Lead (optional)" value={form.teamLead} onChangeText={v => set('teamLead', v)} placeholder="Team lead name" />
      <FormInput label="Weather Conditions" value={form.weatherConditions} onChangeText={v => set('weatherConditions', v)} placeholder="e.g. Clear, Light Rain" />
      <FormInput label="Access Issues" value={form.accessIssues} onChangeText={v => set('accessIssues', v)} placeholder="Describe any access challenges…" multiline />
      <FormInput label="Additional Notes" value={form.additionalNotes} onChangeText={v => set('additionalNotes', v)} placeholder="Any additional field observations…" multiline />
    </View>
  );
}

// ─── Reusable sub-components ──────────────────────────────────────────────────

function Chip({ label, selected, onPress, selectedColor = '#1d4ed8' }: {
  label: string;
  selected: boolean;
  onPress: () => void;
  selectedColor?: string;
}) {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && { backgroundColor: selectedColor + '18', borderColor: selectedColor }]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, selected && { color: selectedColor, fontWeight: '600' }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function FormInput({ label, value, onChangeText, placeholder, multiline, autoCapitalize, keyboardType }: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: any;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        textAlignVertical={multiline ? 'top' : 'center'}
        autoCapitalize={autoCapitalize ?? 'sentences'}
        keyboardType={keyboardType ?? 'default'}
      />
    </View>
  );
}

function PickerModal({ visible, title, items, selected, onSelect, onClose }: {
  visible: boolean;
  title: string;
  items: string[];
  selected: string;
  onSelect: (v: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} onPress={onClose} activeOpacity={1}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color="#374151" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={items}
            keyExtractor={i => i}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.modalItem, item === selected && styles.modalItemSelected]}
                onPress={() => onSelect(item)}
              >
                <Text style={[styles.modalItemText, item === selected && styles.modalItemTextSelected]}>
                  {item}
                </Text>
                {item === selected && <Ionicons name="checkmark" size={18} color="#1d4ed8" />}
              </TouchableOpacity>
            )}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

function formatValue(v: number): string {
  if (v >= 1_000_000) return `VUV ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `VUV ${(v / 1_000).toFixed(0)}K`;
  return `VUV ${v}`;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f1f5f9' },
  scrollContent: { padding: 14, paddingBottom: 16 },

  stepBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  stepItem: { alignItems: 'center', gap: 4 },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: { backgroundColor: '#1d4ed8' },
  stepDotDone: { backgroundColor: '#16a34a' },
  stepNum: { fontSize: 12, color: '#9ca3af', fontWeight: '600' },
  stepNumActive: { color: '#ffffff' },
  stepLabel: { fontSize: 9, color: '#9ca3af', textAlign: 'center' },
  stepLabelActive: { color: '#1d4ed8', fontWeight: '600' },
  stepLine: { flex: 1, height: 2, backgroundColor: '#e5e7eb', marginBottom: 12 },
  stepLineDone: { backgroundColor: '#16a34a' },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  hintText: { fontSize: 13, color: '#6b7280', marginBottom: 12, lineHeight: 18 },
  optionalHint: { fontSize: 12, color: '#9ca3af', textAlign: 'center', marginTop: 12, lineHeight: 18 },

  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 4 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    backgroundColor: '#f9fafb',
  },
  chipText: { fontSize: 13, color: '#374151' },

  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 11,
    backgroundColor: '#f9fafb',
    marginBottom: 12,
  },
  pickerDisabled: { opacity: 0.5 },
  pickerText: { fontSize: 15, color: '#111827' },
  pickerPlaceholder: { fontSize: 15, color: '#9ca3af' },

  inputGroup: { marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 11,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#f9fafb',
  },
  inputMultiline: { height: 88, textAlignVertical: 'top' },

  locationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  locationBoxActive: { borderColor: '#1d4ed8', backgroundColor: '#eff6ff' },
  locationInfo: { gap: 2 },
  locationCoord: { fontSize: 14, color: '#111827', fontWeight: '500' },
  locationAccuracy: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  locationPlaceholder: { fontSize: 14, color: '#9ca3af' },
  locationBtn: {
    backgroundColor: '#1d4ed8',
    borderRadius: 10,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  locationBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '600' },

  damageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  damageCard: {
    flex: 1,
    minWidth: '44%',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  damageCardSelected: { borderColor: '#1d4ed8', backgroundColor: '#eff6ff' },
  damageLabel: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 4 },
  damagePercent: { fontSize: 13, color: '#6b7280', fontWeight: '600' },
  damagePercentSelected: { color: '#1d4ed8' },
  damageDesc: { fontSize: 11, color: '#9ca3af', textAlign: 'center', marginTop: 4 },

  needsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  needChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    backgroundColor: '#f9fafb',
  },
  needChipSelected: { borderColor: '#1d4ed8', backgroundColor: '#eff6ff' },
  needChipText: { fontSize: 12, color: '#374151' },
  needChipTextSelected: { color: '#1d4ed8', fontWeight: '600' },

  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 10,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: 10,
  },
  navBtnDisabled: { opacity: 0.4 },
  prevBtn: { backgroundColor: '#f3f4f6' },
  nextBtn: { backgroundColor: '#1d4ed8', flex: 1, justifyContent: 'center' },
  submitBtn: { backgroundColor: '#16a34a', flex: 1, justifyContent: 'center' },
  navBtnText: { fontSize: 15, color: '#374151', fontWeight: '600' },
  navBtnTextDisabled: { color: '#d1d5db' },
  nextBtnText: { fontSize: 15, color: '#ffffff', fontWeight: '600' },

  pickerLocked: { backgroundColor: '#f1f5f9', borderColor: '#e5e7eb' },

  assignmentBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#eff6ff',
    borderBottomWidth: 1,
    borderBottomColor: '#bfdbfe',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  assignmentBannerText: { flex: 1, gap: 1 },
  assignmentBannerTitle: { fontSize: 13, fontWeight: '700', color: '#1d4ed8' },
  assignmentBannerSub: { fontSize: 12, color: '#3b82f6' },
  assignmentBannerNotes: { fontSize: 12, color: '#6b7280', marginTop: 2, lineHeight: 16 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalItemSelected: { backgroundColor: '#eff6ff' },
  modalItemText: { fontSize: 15, color: '#374151' },
  modalItemTextSelected: { color: '#1d4ed8', fontWeight: '600' },
});
