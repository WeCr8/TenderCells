// Animal Health Repository Page
export function createAnimalHealthPage() {
  return `
    <div class="animal-health-page">
      <!-- Hero Section -->
      <section class="animal-health-hero">
        <div class="container">
          <div class="animal-health-hero-content">
            <div class="animal-health-hero-text">
              <h1>Animal Health Repository</h1>
              <p class="animal-health-tagline">Comprehensive health information for smart farming</p>
              <p class="animal-health-description">
                Your complete resource for animal health management, disease prevention, nutrition guidance, 
                and wellness monitoring. Backed by veterinary expertise and smart farming technology to keep 
                your animals healthy and productive.
              </p>
              <div class="animal-health-hero-buttons">
                <button class="btn btn-primary btn-large">
                  Browse Health Guides
                </button>
                <button class="btn btn-secondary btn-large">
                  Emergency Health Guide
                </button>
              </div>
            </div>
            <div class="animal-health-hero-image">
              <img src="https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop" alt="Animal Health Management">
            </div>
          </div>
        </div>
      </section>

      <!-- Quick Access Section -->
      <section class="quick-access">
        <div class="container">
          <h2>Quick Health Resources</h2>
          <div class="quick-access-grid">
            <div class="quick-access-card emergency">
              <div class="access-icon">🚨</div>
              <h3>Emergency Guide</h3>
              <p>Immediate action steps for health emergencies and when to call a veterinarian.</p>
              <button class="btn btn-primary">Emergency Actions</button>
            </div>
            
            <div class="quick-access-card">
              <div class="access-icon">💊</div>
              <h3>Common Treatments</h3>
              <p>Safe, effective treatments for common health issues with dosage guidelines.</p>
              <button class="btn btn-primary">View Treatments</button>
            </div>
            
            <div class="quick-access-card">
              <div class="access-icon">🔍</div>
              <h3>Symptom Checker</h3>
              <p>Interactive tool to help identify potential health issues based on symptoms.</p>
              <button class="btn btn-primary">Check Symptoms</button>
            </div>
            
            <div class="quick-access-card">
              <div class="access-icon">📞</div>
              <h3>Vet Directory</h3>
              <p>Find qualified veterinarians in your area who specialize in farm animals.</p>
              <button class="btn btn-primary">Find Vets</button>
            </div>
          </div>
        </div>
      </section>

      <!-- Animal Categories -->
      <section class="animal-categories">
        <div class="container">
          <h2>Health Information by Animal</h2>
          <div class="animal-tabs">
            <button class="animal-tab active" data-animal="chickens">🐔 Chickens</button>
            <button class="animal-tab" data-animal="cattle">🐄 Cattle</button>
            <button class="animal-tab" data-animal="pigs">🐷 Pigs</button>
            <button class="animal-tab" data-animal="goats">🐐 Goats</button>
            <button class="animal-tab" data-animal="ducks">🦆 Ducks</button>
          </div>

          <!-- Chickens Content -->
          <div class="animal-content active" id="chickens">
            <div class="animal-health-grid">
              <div class="health-category">
                <h3>🏥 Common Health Issues</h3>
                <ul class="health-list">
                  <li><a href="#health/chickens/respiratory">Respiratory Infections</a></li>
                  <li><a href="#health/chickens/parasites">Internal & External Parasites</a></li>
                  <li><a href="#health/chickens/egg-binding">Egg Binding</a></li>
                  <li><a href="#health/chickens/bumblefoot">Bumblefoot</a></li>
                  <li><a href="#health/chickens/coccidiosis">Coccidiosis</a></li>
                  <li><a href="#health/chickens/marek">Marek's Disease</a></li>
                </ul>
              </div>
              
              <div class="health-category">
                <h3>🍽️ Nutrition & Feeding</h3>
                <ul class="health-list">
                  <li><a href="#health/chickens/nutrition-basics">Basic Nutritional Needs</a></li>
                  <li><a href="#health/chickens/feeding-schedule">Feeding Schedules by Age</a></li>
                  <li><a href="#health/chickens/supplements">Supplements & Vitamins</a></li>
                  <li><a href="#health/chickens/treats">Safe Treats & Foods to Avoid</a></li>
                  <li><a href="#health/chickens/water-quality">Water Quality Requirements</a></li>
                </ul>
              </div>
              
              <div class="health-category">
                <h3>💉 Preventive Care</h3>
                <ul class="health-list">
                  <li><a href="#health/chickens/vaccination">Vaccination Schedules</a></li>
                  <li><a href="#health/chickens/biosecurity">Biosecurity Measures</a></li>
                  <li><a href="#health/chickens/quarantine">Quarantine Protocols</a></li>
                  <li><a href="#health/chickens/cleaning">Coop Cleaning & Disinfection</a></li>
                  <li><a href="#health/chickens/monitoring">Health Monitoring Checklist</a></li>
                </ul>
              </div>
              
              <div class="health-category">
                <h3>🌡️ Environmental Health</h3>
                <ul class="health-list">
                  <li><a href="#health/chickens/temperature">Temperature Management</a></li>
                  <li><a href="#health/chickens/ventilation">Proper Ventilation</a></li>
                  <li><a href="#health/chickens/lighting">Lighting Requirements</a></li>
                  <li><a href="#health/chickens/space">Space & Housing Requirements</a></li>
                  <li><a href="#health/chickens/stress">Stress Reduction Techniques</a></li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Cattle Content -->
          <div class="animal-content" id="cattle">
            <div class="animal-health-grid">
              <div class="health-category">
                <h3>🏥 Common Health Issues</h3>
                <ul class="health-list">
                  <li><a href="#health/cattle/mastitis">Mastitis</a></li>
                  <li><a href="#health/cattle/lameness">Lameness & Hoof Problems</a></li>
                  <li><a href="#health/cattle/respiratory">Respiratory Diseases</a></li>
                  <li><a href="#health/cattle/digestive">Digestive Disorders</a></li>
                  <li><a href="#health/cattle/reproductive">Reproductive Issues</a></li>
                  <li><a href="#health/cattle/parasites">Parasite Management</a></li>
                </ul>
              </div>
              
              <div class="health-category">
                <h3>🍽️ Nutrition & Feeding</h3>
                <ul class="health-list">
                  <li><a href="#health/cattle/nutrition-basics">Nutritional Requirements</a></li>
                  <li><a href="#health/cattle/pasture-management">Pasture Management</a></li>
                  <li><a href="#health/cattle/feed-quality">Feed Quality Assessment</a></li>
                  <li><a href="#health/cattle/mineral-supplements">Mineral Supplements</a></li>
                  <li><a href="#health/cattle/water-systems">Water System Management</a></li>
                </ul>
              </div>
              
              <div class="health-category">
                <h3>💉 Preventive Care</h3>
                <ul class="health-list">
                  <li><a href="#health/cattle/vaccination-programs">Vaccination Programs</a></li>
                  <li><a href="#health/cattle/herd-health">Herd Health Planning</a></li>
                  <li><a href="#health/cattle/breeding-soundness">Breeding Soundness Exams</a></li>
                  <li><a href="#health/cattle/record-keeping">Health Record Keeping</a></li>
                  <li><a href="#health/cattle/biosecurity">Biosecurity Protocols</a></li>
                </ul>
              </div>
              
              <div class="health-category">
                <h3>🌡️ Environmental Health</h3>
                <ul class="health-list">
                  <li><a href="#health/cattle/heat-stress">Heat Stress Prevention</a></li>
                  <li><a href="#health/cattle/shelter">Shelter Requirements</a></li>
                  <li><a href="#health/cattle/fencing">Safe Fencing Practices</a></li>
                  <li><a href="#health/cattle/handling">Low-Stress Handling</a></li>
                  <li><a href="#health/cattle/facility-design">Facility Design for Health</a></li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Pigs Content -->
          <div class="animal-content" id="pigs">
            <div class="animal-health-grid">
              <div class="health-category">
                <h3>🏥 Common Health Issues</h3>
                <ul class="health-list">
                  <li><a href="#health/pigs/respiratory">Respiratory Diseases</a></li>
                  <li><a href="#health/pigs/digestive">Digestive Problems</a></li>
                  <li><a href="#health/pigs/skin-conditions">Skin Conditions</a></li>
                  <li><a href="#health/pigs/reproductive">Reproductive Issues</a></li>
                  <li><a href="#health/pigs/lameness">Lameness & Joint Problems</a></li>
                  <li><a href="#health/pigs/parasites">Parasite Control</a></li>
                </ul>
              </div>
              
              <div class="health-category">
                <h3>🍽️ Nutrition & Feeding</h3>
                <ul class="health-list">
                  <li><a href="#health/pigs/nutrition-phases">Nutrition by Growth Phase</a></li>
                  <li><a href="#health/pigs/feed-formulation">Feed Formulation</a></li>
                  <li><a href="#health/pigs/feeding-systems">Feeding System Design</a></li>
                  <li><a href="#health/pigs/water-requirements">Water Requirements</a></li>
                  <li><a href="#health/pigs/feed-safety">Feed Safety & Storage</a></li>
                </ul>
              </div>
              
              <div class="health-category">
                <h3>💉 Preventive Care</h3>
                <ul class="health-list">
                  <li><a href="#health/pigs/vaccination">Vaccination Protocols</a></li>
                  <li><a href="#health/pigs/biosecurity">Biosecurity Measures</a></li>
                  <li><a href="#health/pigs/health-monitoring">Health Monitoring</a></li>
                  <li><a href="#health/pigs/quarantine">Quarantine Procedures</a></li>
                  <li><a href="#health/pigs/sanitation">Sanitation Programs</a></li>
                </ul>
              </div>
              
              <div class="health-category">
                <h3>🌡️ Environmental Health</h3>
                <ul class="health-list">
                  <li><a href="#health/pigs/temperature-control">Temperature Control</a></li>
                  <li><a href="#health/pigs/ventilation">Ventilation Systems</a></li>
                  <li><a href="#health/pigs/air-quality">Air Quality Management</a></li>
                  <li><a href="#health/pigs/housing-design">Housing Design</a></li>
                  <li><a href="#health/pigs/waste-management">Waste Management</a></li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Goats Content -->
          <div class="animal-content" id="goats">
            <div class="animal-health-grid">
              <div class="health-category">
                <h3>🏥 Common Health Issues</h3>
                <ul class="health-list">
                  <li><a href="#health/goats/parasites">Internal Parasites</a></li>
                  <li><a href="#health/goats/hoof-problems">Hoof Problems</a></li>
                  <li><a href="#health/goats/respiratory">Respiratory Issues</a></li>
                  <li><a href="#health/goats/kidding-problems">Kidding Complications</a></li>
                  <li><a href="#health/goats/mastitis">Mastitis in Does</a></li>
                  <li><a href="#health/goats/urinary-calculi">Urinary Calculi</a></li>
                </ul>
              </div>
              
              <div class="health-category">
                <h3>🍽️ Nutrition & Feeding</h3>
                <ul class="health-list">
                  <li><a href="#health/goats/browse-pasture">Browse & Pasture Management</a></li>
                  <li><a href="#health/goats/mineral-nutrition">Mineral Nutrition</a></li>
                  <li><a href="#health/goats/feeding-lactating">Feeding Lactating Does</a></li>
                  <li><a href="#health/goats/kid-nutrition">Kid Nutrition</a></li>
                  <li><a href="#health/goats/toxic-plants">Toxic Plants to Avoid</a></li>
                </ul>
              </div>
              
              <div class="health-category">
                <h3>💉 Preventive Care</h3>
                <ul class="health-list">
                  <li><a href="#health/goats/vaccination">Vaccination Schedules</a></li>
                  <li><a href="#health/goats/hoof-trimming">Hoof Trimming</a></li>
                  <li><a href="#health/goats/deworming">Deworming Protocols</a></li>
                  <li><a href="#health/goats/body-condition">Body Condition Scoring</a></li>
                  <li><a href="#health/goats/breeding-health">Breeding Health Management</a></li>
                </ul>
              </div>
              
              <div class="health-category">
                <h3>🌡️ Environmental Health</h3>
                <ul class="health-list">
                  <li><a href="#health/goats/shelter-requirements">Shelter Requirements</a></li>
                  <li><a href="#health/goats/fencing">Proper Fencing</a></li>
                  <li><a href="#health/goats/predator-protection">Predator Protection</a></li>
                  <li><a href="#health/goats/pasture-rotation">Pasture Rotation</a></li>
                  <li><a href="#health/goats/seasonal-care">Seasonal Care</a></li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Ducks Content -->
          <div class="animal-content" id="ducks">
            <div class="animal-health-grid">
              <div class="health-category">
                <h3>🏥 Common Health Issues</h3>
                <ul class="health-list">
                  <li><a href="#health/ducks/respiratory">Respiratory Infections</a></li>
                  <li><a href="#health/ducks/leg-problems">Leg & Foot Problems</a></li>
                  <li><a href="#health/ducks/egg-binding">Egg Binding</a></li>
                  <li><a href="#health/ducks/parasites">Parasite Management</a></li>
                  <li><a href="#health/ducks/botulism">Botulism Prevention</a></li>
                  <li><a href="#health/ducks/angel-wing">Angel Wing Syndrome</a></li>
                </ul>
              </div>
              
              <div class="health-category">
                <h3>🍽️ Nutrition & Feeding</h3>
                <ul class="health-list">
                  <li><a href="#health/ducks/waterfowl-nutrition">Waterfowl Nutrition Basics</a></li>
                  <li><a href="#health/ducks/feeding-schedules">Feeding Schedules</a></li>
                  <li><a href="#health/ducks/breeding-nutrition">Breeding Season Nutrition</a></li>
                  <li><a href="#health/ducks/duckling-care">Duckling Feeding</a></li>
                  <li><a href="#health/ducks/foraging">Natural Foraging</a></li>
                </ul>
              </div>
              
              <div class="health-category">
                <h3>💉 Preventive Care</h3>
                <ul class="health-list">
                  <li><a href="#health/ducks/vaccination">Vaccination Programs</a></li>
                  <li><a href="#health/ducks/water-quality">Water Quality Management</a></li>
                  <li><a href="#health/ducks/pond-maintenance">Pond Maintenance</a></li>
                  <li><a href="#health/ducks/health-checks">Regular Health Checks</a></li>
                  <li><a href="#health/ducks/biosecurity">Biosecurity for Waterfowl</a></li>
                </ul>
              </div>
              
              <div class="health-category">
                <h3>🌡️ Environmental Health</h3>
                <ul class="health-list">
                  <li><a href="#health/ducks/water-access">Water Access Requirements</a></li>
                  <li><a href="#health/ducks/shelter-design">Shelter Design</a></li>
                  <li><a href="#health/ducks/predator-protection">Predator Protection</a></li>
                  <li><a href="#health/ducks/seasonal-management">Seasonal Management</a></li>
                  <li><a href="#health/ducks/breeding-environment">Breeding Environment</a></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Health Monitoring with Technology -->
      <section class="tech-health-monitoring">
        <div class="container">
          <div class="monitoring-content">
            <div class="monitoring-text">
              <h2>Smart Health Monitoring</h2>
              <p>Leverage Tender Cells technology to monitor animal health proactively and catch issues before they become serious problems.</p>
              
              <div class="monitoring-features">
                <div class="feature-item">
                  <div class="feature-icon">📊</div>
                  <div>
                    <h4>Behavioral Analytics</h4>
                    <p>AI-powered analysis of feeding, movement, and social behaviors to detect health changes early</p>
                  </div>
                </div>
                
                <div class="feature-item">
                  <div class="feature-icon">🌡️</div>
                  <div>
                    <h4>Environmental Monitoring</h4>
                    <p>Continuous tracking of temperature, humidity, and air quality to maintain optimal health conditions</p>
                  </div>
                </div>
                
                <div class="feature-item">
                  <div class="feature-icon">🔔</div>
                  <div>
                    <h4>Health Alerts</h4>
                    <p>Instant notifications when health parameters fall outside normal ranges or concerning patterns emerge</p>
                  </div>
                </div>
                
                <div class="feature-item">
                  <div class="feature-icon">📈</div>
                  <div>
                    <h4>Trend Analysis</h4>
                    <p>Long-term health trend tracking to optimize care protocols and prevent recurring issues</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="monitoring-image">
              <img src="https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop" alt="Smart Health Monitoring">
            </div>
          </div>
        </div>
      </section>

      <!-- Veterinary Resources -->
      <section class="veterinary-resources">
        <div class="container">
          <h2>Veterinary Resources</h2>
          <div class="vet-resources-grid">
            <div class="resource-card">
              <div class="resource-icon">👩‍⚕️</div>
              <h3>Find a Veterinarian</h3>
              <p>Locate qualified veterinarians in your area who specialize in farm animals and livestock.</p>
              <div class="resource-features">
                <span class="feature-tag">Location Search</span>
                <span class="feature-tag">Specialization Filter</span>
                <span class="feature-tag">Reviews & Ratings</span>
              </div>
              <button class="btn btn-primary">Search Vets</button>
            </div>
            
            <div class="resource-card">
              <div class="resource-icon">📋</div>
              <h3>Health Record Templates</h3>
              <p>Downloadable templates for maintaining comprehensive health records for your animals.</p>
              <div class="resource-features">
                <span class="feature-tag">Vaccination Records</span>
                <span class="feature-tag">Treatment Logs</span>
                <span class="feature-tag">Growth Charts</span>
              </div>
              <button class="btn btn-primary">Download Templates</button>
            </div>
            
            <div class="resource-card">
              <div class="resource-icon">💊</div>
              <h3>Medication Calculator</h3>
              <p>Safe dosage calculators for common medications based on animal weight and condition.</p>
              <div class="resource-features">
                <span class="feature-tag">Weight-Based Dosing</span>
                <span class="feature-tag">Safety Warnings</span>
                <span class="feature-tag">Withdrawal Times</span>
              </div>
              <button class="btn btn-primary">Calculate Dosage</button>
            </div>
            
            <div class="resource-card">
              <div class="resource-icon">📚</div>
              <h3>Research Library</h3>
              <p>Access to peer-reviewed research papers and veterinary studies on farm animal health.</p>
              <div class="resource-features">
                <span class="feature-tag">Peer-Reviewed</span>
                <span class="feature-tag">Latest Research</span>
                <span class="feature-tag">Evidence-Based</span>
              </div>
              <button class="btn btn-primary">Browse Research</button>
            </div>
          </div>
        </div>
      </section>

      <!-- Emergency Protocols -->
      <section class="emergency-protocols">
        <div class="container">
          <div class="emergency-header">
            <div class="emergency-icon">🚨</div>
            <h2>Emergency Health Protocols</h2>
          </div>
          <p class="emergency-description">Quick reference guides for common animal health emergencies. Always consult with a veterinarian for serious conditions.</p>
          
          <div class="emergency-grid">
            <div class="emergency-card">
              <h3>🫁 Respiratory Distress</h3>
              <div class="emergency-steps">
                <ol>
                  <li>Move animal to well-ventilated area</li>
                  <li>Check for airway obstructions</li>
                  <li>Monitor breathing rate and effort</li>
                  <li>Contact veterinarian immediately</li>
                  <li>Keep animal calm and quiet</li>
                </ol>
              </div>
              <div class="emergency-warning">
                <strong>⚠️ Call vet immediately if:</strong> Blue gums, open-mouth breathing, severe distress
              </div>
            </div>
            
            <div class="emergency-card">
              <h3>🩸 Severe Bleeding</h3>
              <div class="emergency-steps">
                <ol>
                  <li>Apply direct pressure to wound</li>
                  <li>Use clean cloth or gauze</li>
                  <li>Elevate injured area if possible</li>
                  <li>Do not remove embedded objects</li>
                  <li>Transport to veterinarian</li>
                </ol>
              </div>
              <div class="emergency-warning">
                <strong>⚠️ Call vet immediately if:</strong> Arterial bleeding, deep wounds, shock symptoms
              </div>
            </div>
            
            <div class="emergency-card">
              <h3>🤒 Suspected Poisoning</h3>
              <div class="emergency-steps">
                <ol>
                  <li>Remove animal from source</li>
                  <li>Identify the toxic substance</li>
                  <li>Do NOT induce vomiting</li>
                  <li>Contact poison control or vet</li>
                  <li>Bring sample of substance</li>
                </ol>
              </div>
              <div class="emergency-warning">
                <strong>⚠️ Call vet immediately if:</strong> Seizures, difficulty breathing, loss of consciousness
              </div>
            </div>
            
            <div class="emergency-card">
              <h3>🔥 Heat Stress</h3>
              <div class="emergency-steps">
                <ol>
                  <li>Move to shade immediately</li>
                  <li>Provide cool (not cold) water</li>
                  <li>Use fans for air circulation</li>
                  <li>Apply cool water to extremities</li>
                  <li>Monitor temperature closely</li>
                </ol>
              </div>
              <div class="emergency-warning">
                <strong>⚠️ Call vet immediately if:</strong> Temperature >105°F, collapse, seizures
              </div>
            </div>
          </div>
          
          <div class="emergency-contacts">
            <h3>Emergency Contacts</h3>
            <div class="contact-grid">
              <div class="contact-item">
                <h4>🏥 Animal Poison Control</h4>
                <p><strong>(888) 426-4435</strong></p>
                <p>24/7 hotline for poisoning emergencies</p>
              </div>
              <div class="contact-item">
                <h4>👩‍⚕️ Emergency Vet Services</h4>
                <p><strong>Find nearest emergency clinic</strong></p>
                <p>Use our vet locator for 24/7 services</p>
              </div>
              <div class="contact-item">
                <h4>📞 Tender Cells Support</h4>
                <p><strong>1-800-URGENT-TC</strong></p>
                <p>Technical support for monitoring systems</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Health Calendar -->
      <section class="health-calendar">
        <div class="container">
          <h2>Seasonal Health Calendar</h2>
          <p class="calendar-description">Stay ahead of seasonal health challenges with our month-by-month care guide.</p>
          
          <div class="calendar-grid">
            <div class="season-card">
              <h3>🌸 Spring (March - May)</h3>
              <div class="season-tasks">
                <h4>Key Health Tasks:</h4>
                <ul>
                  <li>Spring vaccination boosters</li>
                  <li>Parasite prevention programs</li>
                  <li>Breeding health checks</li>
                  <li>Pasture preparation and testing</li>
                  <li>Equipment maintenance and calibration</li>
                </ul>
              </div>
              <div class="season-alerts">
                <h4>Watch For:</h4>
                <ul>
                  <li>Increased parasite loads</li>
                  <li>Respiratory issues from weather changes</li>
                  <li>Nutritional deficiencies after winter</li>
                </ul>
              </div>
            </div>
            
            <div class="season-card">
              <h3>☀️ Summer (June - August)</h3>
              <div class="season-tasks">
                <h4>Key Health Tasks:</h4>
                <ul>
                  <li>Heat stress prevention measures</li>
                  <li>Increased water quality monitoring</li>
                  <li>Fly and pest control programs</li>
                  <li>Shade structure maintenance</li>
                  <li>Electrolyte supplementation</li>
                </ul>
              </div>
              <div class="season-alerts">
                <h4>Watch For:</h4>
                <ul>
                  <li>Heat exhaustion symptoms</li>
                  <li>Decreased feed intake</li>
                  <li>Water system failures</li>
                </ul>
              </div>
            </div>
            
            <div class="season-card">
              <h3>🍂 Fall (September - November)</h3>
              <div class="season-tasks">
                <h4>Key Health Tasks:</h4>
                <ul>
                  <li>Winter preparation health checks</li>
                  <li>Body condition assessments</li>
                  <li>Facility winterization</li>
                  <li>Feed quality testing</li>
                  <li>Breeding program planning</li>
                </ul>
              </div>
              <div class="season-alerts">
                <h4>Watch For:</h4>
                <ul>
                  <li>Respiratory issues from temperature swings</li>
                  <li>Nutritional needs changes</li>
                  <li>Molting stress in poultry</li>
                </ul>
              </div>
            </div>
            
            <div class="season-card">
              <h3>❄️ Winter (December - February)</h3>
              <div class="season-tasks">
                <h4>Key Health Tasks:</h4>
                <ul>
                  <li>Cold stress monitoring</li>
                  <li>Ventilation without drafts</li>
                  <li>Water system freeze prevention</li>
                  <li>Increased caloric intake</li>
                  <li>Vitamin D supplementation</li>
                </ul>
              </div>
              <div class="season-alerts">
                <h4>Watch For:</h4>
                <ul>
                  <li>Frostbite on extremities</li>
                  <li>Respiratory issues from poor ventilation</li>
                  <li>Reduced egg production</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Health Monitoring Tools -->
      <section class="health-tools">
        <div class="container">
          <h2>Health Monitoring Tools</h2>
          <div class="tools-grid">
            <div class="tool-card">
              <div class="tool-icon">📊</div>
              <h3>Health Dashboard</h3>
              <p>Comprehensive health metrics dashboard powered by Tender Cells sensors and AI analytics.</p>
              <div class="tool-features">
                <ul>
                  <li>Real-time vital sign monitoring</li>
                  <li>Behavioral pattern analysis</li>
                  <li>Predictive health alerts</li>
                  <li>Historical health trends</li>
                </ul>
              </div>
              <button class="btn btn-primary">View Dashboard</button>
            </div>
            
            <div class="tool-card">
              <div class="tool-icon">📱</div>
              <h3>Mobile Health App</h3>
              <p>Track animal health on-the-go with our comprehensive mobile application.</p>
              <div class="tool-features">
                <ul>
                  <li>Health record management</li>
                  <li>Medication reminders</li>
                  <li>Symptom photo documentation</li>
                  <li>Vet appointment scheduling</li>
                </ul>
              </div>
              <button class="btn btn-primary">Download App</button>
            </div>
            
            <div class="tool-card">
              <div class="tool-icon">🔬</div>
              <h3>Health Analytics</h3>
              <p>Advanced analytics to identify health patterns and optimize care protocols.</p>
              <div class="tool-features">
                <ul>
                  <li>Predictive health modeling</li>
                  <li>Treatment effectiveness analysis</li>
                  <li>Herd health comparisons</li>
                  <li>Cost-benefit analysis</li>
                </ul>
              </div>
              <button class="btn btn-primary">View Analytics</button>
            </div>
          </div>
        </div>
      </section>

      <!-- Expert Contributors -->
      <section class="expert-contributors">
        <div class="container">
          <h2>Expert Contributors</h2>
          <p class="contributors-description">Our animal health content is developed and reviewed by qualified veterinarians and animal health specialists.</p>
          
          <div class="contributors-grid">
            <div class="contributor-card">
              <div class="contributor-image">
                <img src="https://images.pexels.com/photos/1181533/pexels-photo-1181533.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop" alt="Dr. Sarah Johnson">
              </div>
              <div class="contributor-info">
                <h4>Dr. Sarah Johnson, DVM</h4>
                <p class="contributor-title">Large Animal Veterinarian</p>
                <p class="contributor-credentials">15+ years experience, Board Certified in Livestock Health</p>
                <p>Specializes in preventive care and herd health management for cattle and small ruminants.</p>
              </div>
            </div>
            
            <div class="contributor-card">
              <div class="contributor-image">
                <img src="https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop" alt="Dr. Michael Chen">
              </div>
              <div class="contributor-info">
                <h4>Dr. Michael Chen, DVM</h4>
                <p class="contributor-title">Poultry Health Specialist</p>
                <p class="contributor-credentials">12+ years experience, Avian Medicine Certification</p>
                <p>Expert in poultry diseases, nutrition, and welfare with focus on backyard flocks.</p>
              </div>
            </div>
            
            <div class="contributor-card">
              <div class="contributor-image">
                <img src="https://images.pexels.com/photos/1181263/pexels-photo-1181263.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop" alt="Dr. Emily Rodriguez">
              </div>
              <div class="contributor-info">
                <h4>Dr. Emily Rodriguez, DVM</h4>
                <p class="contributor-title">Swine Health Consultant</p>
                <p class="contributor-credentials">10+ years experience, Swine Health Specialist</p>
                <p>Focuses on pig health management, biosecurity, and production medicine.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Newsletter Signup -->
      <section class="health-newsletter">
        <div class="container">
          <div class="newsletter-card">
            <h2>Stay Updated on Animal Health</h2>
            <p>Get monthly health tips, seasonal care guides, and the latest research delivered to your inbox.</p>
            <form class="newsletter-form">
              <input type="email" placeholder="Enter your email" required>
              <button type="submit" class="btn btn-primary">Subscribe to Health Updates</button>
            </form>
          </div>
        </div>
      </section>
    </div>
  `;
}

export function initializeAnimalHealthPage() {
  // Animal tab switching
  const animalTabs = document.querySelectorAll('.animal-tab');
  const animalContents = document.querySelectorAll('.animal-content');
  
  animalTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active class from all tabs and content
      animalTabs.forEach(t => t.classList.remove('active'));
      animalContents.forEach(c => c.classList.remove('active'));
      
      // Add active class to clicked tab
      tab.classList.add('active');
      
      // Show corresponding content
      const animal = tab.dataset.animal;
      document.getElementById(animal).classList.add('active');
    });
  });
  
  // Newsletter form handler
  const form = document.querySelector('.newsletter-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = e.target.querySelector('input[type="email"]').value;
      alert(`Thank you! We'll send animal health updates to ${email}.`);
      e.target.reset();
    });
  }
  
  console.log('Animal Health page initialized');
}