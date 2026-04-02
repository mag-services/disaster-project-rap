import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Camera, MapPin, Upload, Save, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { dbHelpers, FieldCheck } from '../database';
import { syncManager } from '../services/syncManager';

const fieldCheckSchema = z.object({
  assetType: z.enum(['education', 'health', 'shelter', 'telecom', 'energy', 'wash', 'food_security', 'logistics']),
  assetId: z.string().min(1, 'Asset ID is required'),
  assetName: z.string().min(1, 'Asset name is required'),
  educationLevel: z.enum(['ecce', 'primary', 'secondary']).optional(),
  constructionType: z.enum(['wood', 'concrete', 'metal', 'mixed']),
  council: z.string().min(1, 'Council is required'),
  province: z.string().min(1, 'Province is required'),
  
  roofDamage: z.object({
    condition: z.enum(['intact', 'minor', 'major', 'destroyed']),
    percentage: z.number().min(0).max(100),
    notes: z.string()
  }),
  
  wallDamage: z.object({
    condition: z.enum(['intact', 'minor', 'major', 'destroyed']),
    percentage: z.number().min(0).max(100),
    notes: z.string()
  }),
  
  functionality: z.enum(['usable', 'partially_usable', 'not_usable']),
  immediateNeeds: z.array(z.string()),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  
  assessorName: z.string().min(1, 'Assessor name is required'),
  assessorId: z.string().min(1, 'Assessor ID is required'),
  teamLead: z.string().optional(),
  
  weatherConditions: z.string(),
  accessIssues: z.string(),
  additionalNotes: z.string()
});

type FieldCheckFormData = z.infer<typeof fieldCheckSchema>;

interface FieldCheckFormProps {
  initialData?: Partial<FieldCheck>;
  onSave?: (fieldCheck: FieldCheck) => void;
  onCancel?: () => void;
}

export const FieldCheckForm: React.FC<FieldCheckFormProps> = ({ 
  initialData, 
  onSave, 
  onCancel 
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photos, setPhotos] = useState<FieldCheck['photos']>(initialData?.photos || []);
  const [gpsCoordinates, setGpsCoordinates] = useState<FieldCheck['gpsCoordinates']>(
    initialData?.gpsCoordinates || { latitude: 0, longitude: 0, accuracy: 0 }
  );
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty }
  } = useForm<FieldCheckFormData>({
    resolver: zodResolver(fieldCheckSchema),
    defaultValues: {
      assetType: initialData?.assetType || 'education',
      assetId: initialData?.assetId || '',
      assetName: initialData?.assetName || '',
      educationLevel: initialData?.educationLevel,
      constructionType: initialData?.constructionType || 'wood',
      council: initialData?.council || '',
      province: initialData?.province || '',
      roofDamage: {
        condition: initialData?.roofDamage?.condition || 'intact',
        percentage: initialData?.roofDamage?.percentage || 0,
        notes: initialData?.roofDamage?.notes || ''
      },
      wallDamage: {
        condition: initialData?.wallDamage?.condition || 'intact',
        percentage: initialData?.wallDamage?.percentage || 0,
        notes: initialData?.wallDamage?.notes || ''
      },
      functionality: initialData?.functionality || 'usable',
      immediateNeeds: initialData?.immediateNeeds || [],
      priority: initialData?.priority || 'medium',
      assessorName: initialData?.assessorName || '',
      assessorId: initialData?.assessorId || '',
      teamLead: initialData?.teamLead || '',
      weatherConditions: initialData?.weatherConditions || '',
      accessIssues: initialData?.accessIssues || '',
      additionalNotes: initialData?.additionalNotes || ''
    }
  });

  const selectedAssetType = watch('assetType');
  const roofCondition = watch('roofDamage.condition');
  const wallCondition = watch('wallDamage.condition');

  // Auto-set damage percentages based on condition
  useEffect(() => {
    const damagePercentages = {
      intact: 0,
      minor: 20,
      major: 60,
      destroyed: 100
    };
    
    setValue('roofDamage.percentage', damagePercentages[roofCondition]);
  }, [roofCondition, setValue]);

  useEffect(() => {
    const damagePercentages = {
      intact: 0,
      minor: 15,
      major: 50,
      destroyed: 100
    };
    
    setValue('wallDamage.percentage', damagePercentages[wallCondition]);
  }, [wallCondition, setValue]);

  const getCurrentLocation = () => {
    setIsGettingLocation(true);
    
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this device');
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude || undefined
        });
        toast.success('Location captured successfully');
        setIsGettingLocation(false);
      },
      (error) => {
        toast.error(`Failed to get location: ${error.message}`);
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const capturePhoto = (type: FieldCheck['photos'][0]['type']) => {
    // This would integrate with react-camera-pro
    // For now, simulate photo capture
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const newPhoto: FieldCheck['photos'][0] = {
            id: `photo-${Date.now()}`,
            type,
            dataUrl: e.target?.result as string,
            timestamp: Date.now(),
            caption: `${type} damage`
          };
          setPhotos([...photos, newPhoto]);
          toast.success(`${type} photo captured`);
        };
        reader.readAsDataURL(file);
      }
    };
    
    input.click();
  };

  const removePhoto = (photoId: string) => {
    setPhotos(photos.filter(p => p.id !== photoId));
    toast.success('Photo removed');
  };

  const onSubmit = async (data: FieldCheckFormData) => {
    setIsSubmitting(true);

    try {
      const fieldCheck: Omit<FieldCheck, 'id'> = {
        uuid: initialData?.uuid || `fc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        deviceId: localStorage.getItem('device_id') || 'unknown',
        timestamp: Date.now(),
        synced: false,
        gpsCoordinates,
        assetType: data.assetType,
        assetId: data.assetId,
        assetName: data.assetName,
        educationLevel: data.educationLevel,
        constructionType: data.constructionType,
        council: data.council,
        province: data.province,
        roofDamage: data.roofDamage,
        wallDamage: data.wallDamage,
        functionality: data.functionality,
        immediateNeeds: data.immediateNeeds,
        priority: data.priority,
        photos,
        assessorName: data.assessorName,
        assessorId: data.assessorId,
        teamLead: data.teamLead,
        weatherConditions: data.weatherConditions,
        accessIssues: data.accessIssues,
        additionalNotes: data.additionalNotes
      };

      if (initialData?.id) {
        // Update existing field check
        await dbHelpers.updateFieldCheck(initialData.id, fieldCheck);
        toast.success('Field check updated successfully');
      } else {
        // Create new field check
        const id = await dbHelpers.addFieldCheck(fieldCheck);
        fieldCheck.id = id;
        toast.success('Field check saved successfully');
      }

      // Trigger sync if online
      if (navigator.onLine) {
        setTimeout(() => syncManager.syncPendingFieldChecks(), 1000);
      }

      onSave?.(fieldCheck as FieldCheck);
      
    } catch (error) {
      console.error('Failed to save field check:', error);
      toast.error('Failed to save field check');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="field-check-form p-4 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">
            {initialData ? 'Edit Field Check' : 'New Field Check'}
          </h2>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Asset Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Asset Type *
              </label>
              <select
                {...register('assetType')}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="education">Education</option>
                <option value="health">Health</option>
                <option value="shelter">Shelter</option>
                <option value="telecom">Telecom</option>
                <option value="energy">Energy</option>
                <option value="wash">WASH</option>
                <option value="food_security">Food Security</option>
                <option value="logistics">Logistics</option>
              </select>
              {errors.assetType && (
                <p className="text-red-500 text-sm mt-1">{errors.assetType.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Construction Type *
              </label>
              <select
                {...register('constructionType')}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="wood">Wood</option>
                <option value="concrete">Concrete</option>
                <option value="metal">Metal</option>
                <option value="mixed">Mixed</option>
              </select>
              {errors.constructionType && (
                <p className="text-red-500 text-sm mt-1">{errors.constructionType.message}</p>
              )}
            </div>

            {selectedAssetType === 'education' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Education Level
                </label>
                <select
                  {...register('educationLevel')}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Level</option>
                  <option value="ecce">ECCE</option>
                  <option value="primary">Primary</option>
                  <option value="secondary">Secondary</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Asset ID *
              </label>
              <input
                type="text"
                {...register('assetId')}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., SCH-001"
              />
              {errors.assetId && (
                <p className="text-red-500 text-sm mt-1">{errors.assetId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Asset Name *
              </label>
              <input
                type="text"
                {...register('assetName')}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Port Vila Primary School"
              />
              {errors.assetName && (
                <p className="text-red-500 text-sm mt-1">{errors.assetName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Province *
              </label>
              <input
                type="text"
                {...register('province')}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Shefa"
              />
              {errors.province && (
                <p className="text-red-500 text-sm mt-1">{errors.province.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Area Council *
              </label>
              <input
                type="text"
                {...register('council')}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Port Vila"
              />
              {errors.council && (
                <p className="text-red-500 text-sm mt-1">{errors.council.message}</p>
              )}
            </div>
          </div>

          {/* GPS Location */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <MapPin className="mr-2" size={20} />
              GPS Location
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={gpsCoordinates.latitude}
                  onChange={(e) => setGpsCoordinates({...gpsCoordinates, latitude: parseFloat(e.target.value) || 0})}
                  className="w-full p-2 border rounded-lg"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={gpsCoordinates.longitude}
                  onChange={(e) => setGpsCoordinates({...gpsCoordinates, longitude: parseFloat(e.target.value) || 0})}
                  className="w-full p-2 border rounded-lg"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Accuracy (m)</label>
                <input
                  type="number"
                  value={gpsCoordinates.accuracy}
                  onChange={(e) => setGpsCoordinates({...gpsCoordinates, accuracy: parseFloat(e.target.value) || 0})}
                  className="w-full p-2 border rounded-lg"
                  readOnly
                />
              </div>
            </div>

            <button
              type="button"
              onClick={getCurrentLocation}
              disabled={isGettingLocation}
              className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
            >
              <MapPin className="mr-2" size={16} />
              {isGettingLocation ? 'Getting Location...' : 'Capture Current Location'}
            </button>
          </div>

          {/* Damage Assessment */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-4">Damage Assessment</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Roof Damage */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-700">Roof Damage</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                  <select
                    {...register('roofDamage.condition')}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="intact">Intact (0-10%)</option>
                    <option value="minor">Minor Damage (10-30%)</option>
                    <option value="major">Major Damage (30-70%)</option>
                    <option value="destroyed">Destroyed (70-100%)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Damage %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    {...register('roofDamage.percentage', { valueAsNumber: true })}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    {...register('roofDamage.notes')}
                    rows={3}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe roof damage..."
                  />
                </div>

                <button
                  type="button"
                  onClick={() => capturePhoto('roof')}
                  className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  <Camera className="mr-2" size={16} />
                  Capture Roof Photo
                </button>
              </div>

              {/* Wall Damage */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-700">Wall Damage</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                  <select
                    {...register('wallDamage.condition')}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="intact">Intact (0-10%)</option>
                    <option value="minor">Minor Damage (10-30%)</option>
                    <option value="major">Major Damage (30-70%)</option>
                    <option value="destroyed">Destroyed (70-100%)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Damage %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    {...register('wallDamage.percentage', { valueAsNumber: true })}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    {...register('wallDamage.notes')}
                    rows={3}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe wall damage..."
                  />
                </div>

                <button
                  type="button"
                  onClick={() => capturePhoto('wall')}
                  className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  <Camera className="mr-2" size={16} />
                  Capture Wall Photo
                </button>
              </div>
            </div>
          </div>

          {/* Photos */}
          {photos.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-4">Captured Photos</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {photos.map((photo) => (
                  <div key={photo.id} className="relative group">
                    <img
                      src={photo.dataUrl}
                      alt={photo.caption}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => removePhoto(photo.id)}
                        className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 capitalize">{photo.type}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Overall Assessment */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-4">Overall Assessment</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Functionality</label>
                <select
                  {...register('functionality')}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="usable">Usable</option>
                  <option value="partially_usable">Partially Usable</option>
                  <option value="not_usable">Not Usable</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  {...register('priority')}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-4">Additional Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assessor Name *</label>
                <input
                  type="text"
                  {...register('assessorName')}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {errors.assessorName && (
                  <p className="text-red-500 text-sm mt-1">{errors.assessorName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assessor ID *</label>
                <input
                  type="text"
                  {...register('assessorId')}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {errors.assessorId && (
                  <p className="text-red-500 text-sm mt-1">{errors.assessorId.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Team Lead</label>
                <input
                  type="text"
                  {...register('teamLead')}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weather Conditions</label>
                <input
                  type="text"
                  {...register('weatherConditions')}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Clear, Light Rain"
                />
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Access Issues</label>
                <textarea
                  {...register('accessIssues')}
                  rows={2}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe any access challenges..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                <textarea
                  {...register('additionalNotes')}
                  rows={3}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Any additional observations..."
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="border-t pt-6 flex justify-between">
            <div className="space-x-4">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              )}
            </div>
            
            <div className="space-x-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
              >
                <Save className="mr-2" size={16} />
                {isSubmitting ? 'Saving...' : 'Save Field Check'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
