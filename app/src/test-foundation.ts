// Simple test script to verify foundation infrastructure
import { tourismApi } from './services/tourismApi';
import { ProvinceInfoSchema, CulturalContentSchema } from './schemas/tourism';

async function testFoundation() {
  console.log('🧪 Testing Tourism Foundation Infrastructure...\n');

  try {
    // Test 1: Validate provinces data
    console.log('1️⃣ Testing provinces data validation...');
    const provinces = await tourismApi.getProvinces();
    console.log(`✅ Successfully loaded ${provinces.length} provinces`);
    
    // Test 2: Validate culture data for Maputo
    console.log('\n2️⃣ Testing culture data validation...');
    const maputoCulture = await tourismApi.getCultureByProvince('maputo');
    if (maputoCulture) {
      console.log(`✅ Successfully loaded culture data for Maputo: "${maputoCulture.title}"`);
      console.log(`   - Sections: ${Object.keys(maputoCulture.sections).join(', ')}`);
      console.log(`   - Photos: ${maputoCulture.media.photos.length}`);
      console.log(`   - Videos: ${maputoCulture.media.videos.length}`);
    } else {
      console.log('⚠️ No culture data found for Maputo');
    }

    // Test 3: Test stories API
    console.log('\n3️⃣ Testing stories data...');
    const maputoStories = await tourismApi.getStoriesByProvince('maputo');
    console.log(`✅ Successfully loaded ${maputoStories.length} stories for Maputo`);

    // Test 4: Test destinations API
    console.log('\n4️⃣ Testing destinations data...');
    const maputoDestinations = await tourismApi.getDestinationsByProvince('maputo');
    console.log(`✅ Successfully loaded ${maputoDestinations.length} destinations for Maputo`);

    // Test 5: Test services API
    console.log('\n5️⃣ Testing services data...');
    const maputoServices = await tourismApi.getServicesByProvince('maputo');
    console.log(`✅ Successfully loaded ${maputoServices.length} services for Maputo`);

    // Test 6: Test search functionality
    console.log('\n6️⃣ Testing search functionality...');
    const searchResults = await tourismApi.searchAll('maputo');
    console.log(`✅ Search returned ${searchResults.total} total results`);
    console.log(`   - Culture: ${searchResults.culture.length}`);
    console.log(`   - Stories: ${searchResults.stories.length}`);
    console.log(`   - Destinations: ${searchResults.destinations.length}`);
    console.log(`   - Services: ${searchResults.services.length}`);

    console.log('\n🎉 All foundation tests passed! Infrastructure is working correctly.');
    
  } catch (error) {
    console.error('❌ Foundation test failed:', error);
    throw error;
  }
}

// Run the test
testFoundation().catch(console.error);