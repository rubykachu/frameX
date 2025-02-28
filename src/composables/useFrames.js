import { ref, computed } from 'vue';

export function useFrames() {
  // Sample frame data - in a production app, this would come from an API
  const sampleFrames = [
    {
      id: 'frame1',
      name: 'Facebook Profile',
      thumbnail: 'https://i.imgur.com/59BflFY.jpeg',
      src: 'https://i.imgur.com/59BflFY.jpeg',
      category: 'social'
    },
    {
      id: 'frame2',
      name: 'Business Card',
      thumbnail: 'https://drive.google.com/file/d/1jRD_7EUNEKVcQThBk4zDRUdOgd28Cgkr/view?usp=drive_link',
      src: 'https://drive.google.com/file/d/1jRD_7EUNEKVcQThBk4zDRUdOgd28Cgkr/view?usp=drive_link',
      category: 'business'
    },
    {
      id: 'frame3',
      name: 'Personal Avatar',
      thumbnail: 'https://via.placeholder.com/150/6366f1/ffffff?text=AVA',
      src: 'https://via.placeholder.com/800/6366f1/ffffff?text=Personal+Frame',
      category: 'personal'
    },
    {
      id: 'frame4',
      name: 'Event Badge',
      thumbnail: 'https://via.placeholder.com/150/be123c/ffffff?text=EVT',
      src: 'https://via.placeholder.com/800/be123c/ffffff?text=Event+Frame',
      category: 'events'
    },
    {
      id: 'frame5',
      name: 'Holiday Theme',
      thumbnail: 'https://via.placeholder.com/150/059669/ffffff?text=HOL',
      src: 'https://via.placeholder.com/800/059669/ffffff?text=Holiday+Frame',
      category: 'holidays'
    },
    {
      id: 'frame6',
      name: 'Decorative Border',
      thumbnail: 'https://via.placeholder.com/150/8b5cf6/ffffff?text=DEC',
      src: 'https://via.placeholder.com/800/8b5cf6/ffffff?text=Decorative+Frame',
      category: 'decorative'
    }
  ];

  const frames = ref(sampleFrames);
  const selectedFrameId = ref(null);
  const selectedCategory = ref('all');

  // Categories for filtering frames
  const categories = [
    { id: 'all', name: 'All Frames' },
    { id: 'holidays', name: 'Holidays' },
    { id: 'business', name: 'Business' },
    { id: 'social', name: 'Social Media' },
    { id: 'personal', name: 'Personal' },
    { id: 'events', name: 'Events' },
    { id: 'decorative', name: 'Decorative' }
  ];

  // Computed properties
  const selectedFrame = computed(() =>
    frames.value.find(frame => frame.id === selectedFrameId.value)
  );

  const filteredFrames = computed(() => {
    if (selectedCategory.value === 'all') {
      return frames.value;
    }
    return frames.value.filter(frame => frame.category === selectedCategory.value);
  });

  // Methods
  const selectFrame = (frameId) => {
    selectedFrameId.value = frameId;
    return selectedFrame.value;
  };

  const addCustomFrame = (frame) => {
    // Generate a unique ID for the custom frame
    const id = `custom-${Date.now()}`;
    const newFrame = {
      id,
      name: 'Custom Frame',
      thumbnail: frame.src,
      src: frame.src,
      category: 'personal'
    };

    frames.value.unshift(newFrame);
    return newFrame;
  };

  const addFrameFromUrl = async (url) => {
    try {
      // Check if the image is accessible
      const response = await fetch(url, { method: 'HEAD' });
      if (!response.ok) {
        throw new Error('Image not found or not accessible');
      }

      const id = `url-${Date.now()}`;
      const newFrame = {
        id,
        name: 'URL Frame',
        thumbnail: url,
        src: url,
        category: 'personal'
      };

      frames.value.unshift(newFrame);
      return newFrame;
    } catch (error) {
      console.error('Error loading frame from URL:', error);
      throw error;
    }
  };

  // Initialize with default frames in a real app
  const loadInitialFrames = async () => {
    try {
      // In a real app, you would fetch frames from an API
      // const response = await fetch('/api/frames');
      // frames.value = await response.json();
    } catch (error) {
      console.error('Error loading frames:', error);
    }
  };

  return {
    frames,
    filteredFrames,
    selectedFrame,
    selectedFrameId,
    selectedCategory,
    categories,
    selectFrame,
    addCustomFrame,
    addFrameFromUrl,
    loadInitialFrames
  };
}
