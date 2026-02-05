import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const KEY = 'adopt_wizard'

export default function StepMatching() {
  const navigate = useNavigate()
  const [form, setForm] = useState(() => {
    try {
      const data = JSON.parse(localStorage.getItem(KEY))
      return data?.compatibilityProfile || {
        size: 'medium',
        energyLevel: 3,
        exerciseNeeds: 'moderate',
        trainingNeeds: 'moderate',
        trainedLevel: 'untrained',
        childFriendlyScore: 5,
        petFriendlyScore: 5,
        strangerFriendlyScore: 5,
        minHomeSize: 0,
        needsYard: false,
        canLiveInApartment: true,
        groomingNeeds: 'moderate',
        estimatedMonthlyCost: 100,
        noiseLevel: 'moderate',
        canBeLeftAlone: true,
        maxHoursAlone: 8,
        requiresExperiencedOwner: false
      }
    } catch {
      return {
        size: 'medium',
        energyLevel: 3,
        exerciseNeeds: 'moderate',
        trainingNeeds: 'moderate',
        trainedLevel: 'untrained',
        childFriendlyScore: 5,
        petFriendlyScore: 5,
        strangerFriendlyScore: 5,
        minHomeSize: 0,
        needsYard: false,
        canLiveInApartment: true,
        groomingNeeds: 'moderate',
        estimatedMonthlyCost: 100,
        noiseLevel: 'moderate',
        canBeLeftAlone: true,
        maxHoursAlone: 8,
        requiresExperiencedOwner: false
      }
    }
  })

  const save = (patch) => {
    const prev = JSON.parse(localStorage.getItem(KEY) || '{}')
    const next = { ...prev, compatibilityProfile: { ...form, ...patch } }
    localStorage.setItem(KEY, JSON.stringify(next))
    setForm({ ...form, ...patch })
  }

  const onChange = (e) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      save({ [name]: e.target.checked })
    } else if (type === 'number') {
      save({ [name]: Number(value) })
    } else {
      save({ [name]: value })
    }
  }

  const prev = () => navigate('/manager/adoption/wizard/health')
  const next = () => navigate('/manager/adoption/wizard/availability')

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100 border-2 border-indigo-300 rounded-xl p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="text-5xl">🎯</div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-indigo-900 mb-2">Smart Matching Profile</h3>
            <p className="text-md text-indigo-800 mb-3">
              <strong>⚠️ CRITICAL:</strong> This data powers our AI matching system. Assess THIS specific pet's behavior — don't rely on breed stereotypes!
            </p>
            <div className="bg-white/60 rounded-lg p-3 text-sm text-gray-700">
              <strong>How it works:</strong> We score each adopter-pet match across 6 dimensions with weighted importance:
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 font-medium">
                <span>🏃 Activity: <span className="text-orange-700">25%</span></span>
                <span>🏠 Living Space: <span className="text-green-700">20%</span></span>
                <span>👨‍👩‍👧‍👦 Family Safety: <span className="text-pink-700">20%</span></span>
                <span>🎓 Experience: <span className="text-purple-700">15%</span></span>
                <span>💰 Budget: <span className="text-blue-700">10%</span></span>
                <span>⭐ Preferences: <span className="text-yellow-700">10%</span></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Compatibility - 25% */}
      <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border-2 border-orange-300 p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-bold text-orange-800">🏃 Activity Compatibility</h4>
          <span className="bg-orange-600 text-white px-3 py-1 rounded-full text-sm font-bold">25% Weight</span>
        </div>
        <p className="text-sm text-orange-700 mb-4">How active is this pet? This is the MOST important factor!</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-800">Pet Size *</label>
            <select 
              name="size"
              value={form.size}
              onChange={onChange}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
            >
              <option value="small">Small (0-20 lbs) - Apartment friendly</option>
              <option value="medium">Medium (20-60 lbs) - Versatile</option>
              <option value="large">Large (60+ lbs) - Needs space</option>
            </select>
          </div>

          <div className="bg-white p-4 rounded-lg border-2 border-orange-200">
            <label className="block text-sm font-semibold mb-2 text-orange-800">⚡ Energy Level *</label>
            <select 
              name="energyLevel"
              value={form.energyLevel}
              onChange={onChange}
              className="w-full px-4 py-3 border-2 border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium text-lg"
            >
              <option value={1}>1 - 😴 Very Low (couch potato, senior)</option>
              <option value={2}>2 - 🛋️ Low (calm, minimal activity)</option>
              <option value={3}>3 - ⚖️ Moderate (balanced, average)</option>
              <option value={4}>4 - 🎾 High (playful, needs exercise)</option>
              <option value={5}>5 - 🚀 Very High (hyperactive, athlete)</option>
            </select>
            <p className="text-xs text-orange-600 mt-2 font-medium">
              💡 1 = Low energy adopter OK | 5 = Active lifestyle required
            </p>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold mb-2 text-gray-800">Daily Exercise Requirements</label>
            <select 
              name="exerciseNeeds"
              value={form.exerciseNeeds}
              onChange={onChange}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
            >
              <option value="minimal">Minimal - 15 min walks, indoor play</option>
              <option value="moderate">Moderate - 30-60 min daily walks</option>
              <option value="high">High - 1-2 hours running/hiking</option>
              <option value="very_high">Very High - 3+ hours intense activity</option>
            </select>
          </div>
        </div>
      </div>

      {/* Family Safety - 20% */}
      <div className="bg-gradient-to-r from-pink-50 to-red-50 rounded-lg border-2 border-pink-300 p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-bold text-pink-800">👨‍👩‍👧‍👦 Family Safety & Social Compatibility</h4>
          <span className="bg-pink-600 text-white px-3 py-1 rounded-full text-sm font-bold">20% Weight</span>
        </div>
        <p className="text-sm text-pink-700 mb-4">CRITICAL: Test with actual children/pets. Don't guess based on breed!</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-lg border-2 border-pink-200">
            <label className="block text-sm font-semibold mb-2 text-pink-800">👶 Good with Children *</label>
            <select 
              name="childFriendlyScore"
              value={form.childFriendlyScore}
              onChange={onChange}
              className="w-full px-4 py-3 border-2 border-pink-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 font-medium text-lg"
            >
              <option value={0}>0 - ❌ Unsafe (aggressive/fearful)</option>
              <option value={1}>1 - 🚫 Very Poor (snaps/bites)</option>
              <option value={3}>3 - ⚠️ Poor (not recommended)</option>
              <option value={5}>5 - 👌 Average (OK with teens 12+)</option>
              <option value={7}>7 - ✅ Good (gentle with kids 6+)</option>
              <option value={9}>9 - 🌟 Excellent (patient with toddlers)</option>
              <option value={10}>10 - 💝 Perfect (therapy-pet level)</option>
            </select>
            <p className="text-xs text-pink-600 mt-2 font-medium">
              💡 Test during supervised child visits. Observe reactions.
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg border-2 border-pink-200">
            <label className="block text-sm font-semibold mb-2 text-pink-800">🐕 Good with Other Pets *</label>
            <select 
              name="petFriendlyScore"
              value={form.petFriendlyScore}
              onChange={onChange}
              className="w-full px-4 py-3 border-2 border-pink-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 font-medium text-lg"
            >
              <option value={0}>0 - ❌ Unsafe (attacks other pets)</option>
              <option value={1}>1 - 🚫 Very Poor (aggressive)</option>
              <option value={3}>3 - ⚠️ Poor (territorial, fights)</option>
              <option value={5}>5 - 👌 Average (neutral, tolerates)</option>
              <option value={7}>7 - ✅ Good (friendly, plays well)</option>
              <option value={9}>9 - 🌟 Excellent (social butterfly)</option>
              <option value={10}>10 - 💝 Perfect (pack animal, loves all)</option>
            </select>
            <p className="text-xs text-pink-600 mt-2 font-medium">
              💡 Observe during playgroups with dogs/cats.
            </p>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold mb-2 text-gray-800">🧍 Good with Strangers</label>
            <select 
              name="strangerFriendlyScore"
              value={form.strangerFriendlyScore}
              onChange={onChange}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 font-medium"
            >
              <option value={0}>0 - Aggressive (bites strangers)</option>
              <option value={3}>3 - Fearful/Shy (hides, cowers)</option>
              <option value={5}>5 - Average (warms up slowly)</option>
              <option value={7}>7 - Friendly (greets nicely)</option>
              <option value={10}>10 - Loves everyone (social star)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Experience Match - 15% */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border-2 border-purple-300 p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-bold text-purple-800">🎓 Training & Experience Required</h4>
          <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold">15% Weight</span>
        </div>
        <p className="text-sm text-purple-700 mb-4">How much work will the new owner need to put in?</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-4 rounded-lg border-2 border-purple-200">
            <label className="block text-sm font-semibold mb-2 text-purple-800">📚 Training Needs *</label>
            <select 
              name="trainingNeeds"
              value={form.trainingNeeds}
              onChange={onChange}
              className="w-full px-4 py-3 border-2 border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
            >
              <option value="low">✅ Low (well-behaved, ready)</option>
              <option value="moderate">⚖️ Moderate (basic training needed)</option>
              <option value="high">⚠️ High (extensive work required)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-800">Current Training Level</label>
            <select 
              name="trainedLevel"
              value={form.trainedLevel}
              onChange={onChange}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
            >
              <option value="untrained">❌ Untrained</option>
              <option value="basic">👌 Basic (sit, stay, come)</option>
              <option value="intermediate">✅ Intermediate (leash, house trained)</option>
              <option value="advanced">🌟 Advanced (therapy level)</option>
            </select>
          </div>

          <div className="bg-white p-4 rounded-lg border-2 border-purple-200">
            <label className="block text-sm font-semibold mb-2 text-purple-800">🏆 Owner Experience *</label>
            <select 
              name="requiresExperiencedOwner"
              value={form.requiresExperiencedOwner}
              onChange={(e) => save({ requiresExperiencedOwner: e.target.value === 'true' })}
              className="w-full px-4 py-3 border-2 border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
            >
              <option value="false">✅ Beginner Friendly</option>
              <option value="true">⚠️ Expert Owner Only</option>
            </select>
            <p className="text-xs text-purple-600 mt-2 font-medium">
              💡 Stubborn/aggressive pets need experienced owners
            </p>
          </div>
        </div>
      </div>

      {/* Living Space - 20% */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-300 p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-bold text-green-800">🏠 Living Space Requirements</h4>
          <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-bold">20% Weight</span>
        </div>
        <p className="text-sm text-green-700 mb-4">Where can this pet live comfortably?</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-4 rounded-lg border-2 border-green-200">
            <label className="block text-sm font-semibold mb-2 text-green-800">🌳 Needs Yard? *</label>
            <select 
              name="needsYard"
              value={form.needsYard}
              onChange={(e) => save({ needsYard: e.target.value === 'true' })}
              className="w-full px-4 py-3 border-2 border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-medium"
            >
              <option value="false">✅ No - Indoor/Walks OK</option>
              <option value="true">🌳 Yes - Yard Required</option>
            </select>
          </div>

          <div className="bg-white p-4 rounded-lg border-2 border-green-200">
            <label className="block text-sm font-semibold mb-2 text-green-800">🏢 Apartment Friendly? *</label>
            <select 
              name="canLiveInApartment"
              value={form.canLiveInApartment}
              onChange={(e) => save({ canLiveInApartment: e.target.value === 'true' })}
              className="w-full px-4 py-3 border-2 border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-medium"
            >
              <option value="true">✅ Yes - Apartment OK</option>
              <option value="false">🏡 No - House/Farm Only</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-800">Min Home Size (sq ft)</label>
            <input
              type="number"
              name="minHomeSize"
              value={form.minHomeSize}
              onChange={onChange}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="0 = any size"
            />
            <p className="text-xs text-gray-500 mt-1">0 = No minimum required</p>
          </div>
        </div>
      </div>

      {/* Budget - 10% */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border-2 border-blue-300 p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-bold text-blue-800">💰 Budget & Care Requirements</h4>
          <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">10% Weight</span>
        </div>
        <p className="text-sm text-blue-700 mb-4">Ongoing monthly expenses the adopter should expect</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-800">✂️ Grooming Needs</label>
            <select 
              name="groomingNeeds"
              value={form.groomingNeeds}
              onChange={onChange}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="low">✅ Low (₹0-2500/mo - brush at home)</option>
              <option value="moderate">⚖️ Moderate (₹2500-5000/mo - monthly salon)</option>
              <option value="high">💸 High (₹5000-10000/mo - weekly professional)</option>
            </select>
          </div>

          <div className="bg-white p-4 rounded-lg border-2 border-blue-200">
            <label className="block text-sm font-semibold mb-2 text-blue-800">💵 Est. Monthly Cost (₹) *</label>
            <input
              type="number"
              name="estimatedMonthlyCost"
              value={form.estimatedMonthlyCost}
              onChange={onChange}
              className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-lg"
              placeholder="8000"
            />
            <p className="text-xs text-blue-600 mt-2 font-medium">
              💡 Include: Food, vet, grooming, toys, insurance
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Low: ₹4000-8000 | Moderate: ₹8000-16000 | High: ₹16000-40000+
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-800">🔊 Noise Level</label>
            <select 
              name="noiseLevel"
              value={form.noiseLevel}
              onChange={onChange}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="quiet">🤫 Quiet (rarely barks/meows)</option>
              <option value="moderate">⚖️ Moderate (occasional)</option>
              <option value="vocal">📢 Vocal (frequent/loud)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Preferences & Behavior - 10% */}
      <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border-2 border-yellow-300 p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-bold text-yellow-800">⭐ Behavioral Preferences</h4>
          <span className="bg-yellow-600 text-white px-3 py-1 rounded-full text-sm font-bold">10% Weight</span>
        </div>
        <p className="text-sm text-yellow-700 mb-4">Additional traits that help with lifestyle matching</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-800">🏠 Can Be Left Alone?</label>
            <select 
              name="canBeLeftAlone"
              value={form.canBeLeftAlone}
              onChange={(e) => save({ canBeLeftAlone: e.target.value === 'true' })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 font-medium"
            >
              <option value="true">✅ Yes - Independent (good for working owners)</option>
              <option value="false">❌ No - Separation Anxiety (needs constant company)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-800">⏰ Maximum Hours Alone Per Day</label>
            <select
              name="maxHoursAlone"
              value={form.maxHoursAlone}
              onChange={onChange}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 font-medium"
            >
              <option value={0}>0 hrs - Cannot be alone</option>
              <option value={2}>2 hrs - Minimal alone time</option>
              <option value={4}>4 hrs - Half day OK</option>
              <option value={8}>8 hrs - Full workday OK</option>
              <option value={12}>12+ hrs - Very independent</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              💡 Consider work schedules of potential adopters
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <button
          onClick={prev}
          className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Previous
        </button>
        <button
          onClick={next}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Next: Adoption Fee
        </button>
      </div>
    </div>
  )
}
