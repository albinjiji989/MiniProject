const mongoose = require('mongoose');

// Import all required models to register them with Mongoose
require('../core/models/User');
require('../core/models/UserDetails');
require('../core/models/Image');
require('../core/models/Document');
require('../core/models/Species');
require('../core/models/Breed');
require('../core/models/PetDetails');
require('../core/models/PetRegistry');

const Pet = require('../core/models/Pet');
const PetRegistry = require('../core/models/PetRegistry');

// Connect to MongoDB
const connectDB = async () => {
  try {
    // Use the same connection string as the main application
    const uri = 'mongodb+srv://albinjiji2026:albinjiji2026@project.gomrcsv.mongodb.net/PetWelfare?retryWrites=true&w=majority&appName=project';
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 20000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

// Test the actual getPetById logic
const testGetPetById = async () => {
  await connectDB();
  
  // Use the same pet ID from the user's issue
  const petId = '68fd3a70550bd93bc40666c8';
  
  try {
    console.log('🔍 Testing getPetById logic for pet:', petId);
    
    // First try to find in Pet model (user-created pets)
    let pet = await Pet.findById(petId)
      .populate('createdBy', 'name email')
      .populate('lastUpdatedBy', 'name email')
      .populate('species', 'name displayName')
      .populate('breed', 'name')
      .populate('imageIds');

    console.log('펫 정보:', {
      found: !!pet,
      name: pet?.name,
      petCode: pet?.petCode,
      imageIds: pet?.imageIds,
      imageIdsLength: pet?.imageIds?.length || 0
    });

    // Manually populate the virtual 'images' field
    if (pet) {
      await pet.populate('images');
      console.log('펫 이미지 정보 (직접 populate 후):', {
        images: pet?.images,
        imagesLength: pet?.images?.length || 0
      });
    }

    // If pet is found but has no images, check if it's a pet shop purchased pet
    if (pet && (!pet.images || pet.images.length === 0) && pet.petCode) {
      console.log('펫에 이미지가 없고 petCode가 있음, PetRegistry에서 이미지 확인 중...');
      
      // Try to get images from PetRegistry
      try {
        const registryPet = await PetRegistry.findOne({ petCode: pet.petCode })
          .populate('imageIds');
        
        console.log('레지스트리 펫 정보:', {
          found: !!registryPet,
          name: registryPet?.name,
          petCode: registryPet?.petCode,
          imageIds: registryPet?.imageIds,
          imageIdsLength: registryPet?.imageIds?.length || 0
        });
        
        if (registryPet) {
          await registryPet.populate('images');
          console.log('레지스트리 펫 이미지 정보 (populate 후):', {
            images: registryPet?.images,
            imagesLength: registryPet?.images?.length || 0
          });
          
          // If registry has images, add them to the pet
          if (registryPet.images && registryPet.images.length > 0) {
            console.log('레지스트리에서 이미지를 찾았습니다. 펫 객체에 추가합니다.');
            
            // Create a plain object to ensure the data is properly structured
            const petData = pet.toObject ? pet.toObject({ virtuals: true }) : { ...pet };
            console.log('변환 전 petData:', {
              images: petData?.images,
              imagesLength: petData?.images?.length || 0,
              imageIds: petData?.imageIds,
              imageIdsLength: petData?.imageIds?.length || 0
            });
            
            petData.images = registryPet.images;
            petData.imageIds = registryPet.imageIds;
            pet = petData;
            
            console.log('변환 후 petData:', {
              images: petData?.images,
              imagesLength: petData?.images?.length || 0,
              imageIds: petData?.imageIds,
              imageIdsLength: petData?.imageIds?.length || 0
            });
          }
        }
      } catch (registryError) {
        console.log('레지스트리에서 이미지 가져오기 실패:', registryError.message);
      }
    }

    console.log('\n=== 최종 결과 ===');
    if (pet) {
      const petData = pet.toObject ? pet.toObject({ virtuals: true }) : { ...pet };
      console.log('최종 펫 데이터:', {
        _id: petData._id,
        name: petData.name,
        petCode: petData.petCode,
        images: petData.images,
        imagesLength: petData.images?.length || 0,
        imageIds: petData.imageIds,
        imageIdsLength: petData.imageIds?.length || 0
      });
      
      // Check if the images field is actually populated
      if (petData.images && petData.images.length > 0) {
        console.log('✅ 이미지가 성공적으로 로드되었습니다!');
        console.log('첫 번째 이미지:', petData.images[0]);
      } else {
        console.log('❌ 이미지가 로드되지 않았습니다.');
      }
    } else {
      console.log('펫을 찾을 수 없습니다.');
    }
    
  } catch (error) {
    console.error('테스트 중 오류 발생:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB 연결이 종료되었습니다.');
  }
};

testGetPetById();