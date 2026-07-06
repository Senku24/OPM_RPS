require('dotenv').config();
const mongoose = require('mongoose');
const Character = require('../models/Character');

const charactersData = [
  {
    slug: 'saitama',
    name: 'Saitama',
    title: 'Caped Baldy',
    tagline: 'One punch is all it takes.',
    tier: 'S',
    avatar: {
      thumbnail: '/assets/characters/saitama/avatar.png',
      fullBody: '/assets/characters/saitama/full.png',
    },
    theme: {
      primaryColor: '#FFD400',
      secondaryColor: '#C60000',
    },
    moves: {
      rock: { label: 'Serious Punch', animationId: 'saitama_rock', vfx: 'shockwave-impact', sfx: 'punch_heavy.mp3' },
      paper: { label: 'Consecutive Normal Punches', animationId: 'saitama_paper', vfx: 'afterimage-flurry', sfx: 'punch_flurry.mp3' },
      scissors: { label: 'Serious Series', animationId: 'saitama_scissors', vfx: 'speed-lines-dash', sfx: 'swoosh_sharp.mp3' }
    },
    isActive: true
  },
  {
    slug: 'genos',
    name: 'Genos',
    title: 'Demon Cyborg',
    tagline: 'I will eliminate the threat.',
    tier: 'S',
    avatar: {
      thumbnail: '/assets/characters/genos/avatar.png',
      fullBody: '/assets/characters/genos/full.png',
    },
    theme: {
      primaryColor: '#A6A6A6',
      secondaryColor: '#FF5E00',
    },
    moves: {
      rock: { label: 'Incineration Cannon', animationId: 'genos_rock', vfx: 'beam-blast', sfx: 'laser_blast.mp3' },
      paper: { label: 'Machine Gun Blitz', animationId: 'genos_paper', vfx: 'spark-shower', sfx: 'rapid_punches.mp3' },
      scissors: { label: 'Blade Mode Slash', animationId: 'genos_scissors', vfx: 'neon-lines', sfx: 'metal_slash.mp3' }
    },
    isActive: true
  },
  {
    slug: 'sonic',
    name: 'Speed-o\'-Sound Sonic',
    title: 'Super-Speed Ninja',
    tagline: 'No one can catch up to my speed.',
    tier: 'A',
    avatar: {
      thumbnail: '/assets/characters/sonic/avatar.png',
      fullBody: '/assets/characters/sonic/full.png',
    },
    theme: {
      primaryColor: '#4A0E4E',
      secondaryColor: '#111111',
    },
    moves: {
      rock: { label: 'Shadow Strike', animationId: 'sonic_rock', vfx: 'shadow-shroud', sfx: 'ninja_strike.mp3' },
      paper: { label: 'Kunai Storm', animationId: 'sonic_paper', vfx: 'shuriken-rain', sfx: 'kunai_throw.mp3' },
      scissors: { label: 'Phantom Step Slash', animationId: 'sonic_scissors', vfx: 'slash-dash', sfx: 'sword_slice.mp3' }
    },
    isActive: true
  },
  {
    slug: 'tatsumaki',
    name: 'Tatsumaki',
    title: 'Tornado of Terror',
    tagline: 'Hmph, you\'re not even worth my time.',
    tier: 'S',
    avatar: {
      thumbnail: '/assets/characters/tatsumaki/avatar.png',
      fullBody: '/assets/characters/tatsumaki/full.png',
    },
    theme: {
      primaryColor: '#00E088',
      secondaryColor: '#1A3D2F',
    },
    moves: {
      rock: { label: 'Psychokinetic Slam', animationId: 'tatsumaki_rock', vfx: 'green-glow-pulse', sfx: 'esper_slam.mp3' },
      paper: { label: 'Debris Barrage', animationId: 'tatsumaki_paper', vfx: 'flying-stones', sfx: 'debris_fall.mp3' },
      scissors: { label: 'Telekinetic Blade', animationId: 'tatsumaki_scissors', vfx: 'energy-blades', sfx: 'psychic_cut.mp3' }
    },
    isActive: true
  },
  {
    slug: 'king',
    name: 'King',
    title: 'The Strongest Man on Earth',
    tagline: 'Do you hear that? The King Engine is roaring.',
    tier: 'S',
    avatar: {
      thumbnail: '/assets/characters/king/avatar.png',
      fullBody: '/assets/characters/king/full.png',
    },
    theme: {
      primaryColor: '#D0A96C',
      secondaryColor: '#781C1C',
    },
    moves: {
      rock: { label: '"King Engine" Flinch', animationId: 'king_rock', vfx: 'heartbeat-shock', sfx: 'king_engine.mp3' },
      paper: { label: 'Panic Shuffle', animationId: 'king_paper', vfx: 'sweat-drops', sfx: 'footsteps_fast.mp3' },
      scissors: { label: 'Accidental Sweep', animationId: 'king_scissors', vfx: 'comic-impact', sfx: 'slip_fall.mp3' }
    },
    isActive: true
  },
  {
    slug: 'mumen_rider',
    name: 'Mumen Rider',
    title: 'Hero of Justice',
    tagline: 'It\'s not about winning or losing! It\'s about me taking you on right here!',
    tier: 'C',
    avatar: {
      thumbnail: '/assets/characters/mumen_rider/avatar.png',
      fullBody: '/assets/characters/mumen_rider/full.png',
    },
    theme: {
      primaryColor: '#336633',
      secondaryColor: '#CC9900',
    },
    moves: {
      rock: { label: 'Justice Kick', animationId: 'mumen_rock', vfx: 'dust-cloud', sfx: 'heroic_kick.mp3' },
      paper: { label: 'Pedal Rush Guard', animationId: 'mumen_paper', vfx: 'shield-spark', sfx: 'bike_bell.mp3' },
      scissors: { label: 'Bicycle Chain Whirl', animationId: 'mumen_scissors', vfx: 'metal-sparkle', sfx: 'chain_whip.mp3' }
    },
    isActive: true
  },
  {
    slug: 'bang',
    name: 'Silver Fang (Bang)',
    title: 'Martial Arts Master',
    tagline: 'Flow like water, strike like rock.',
    tier: 'S',
    avatar: {
      thumbnail: '/assets/characters/bang/avatar.png',
      fullBody: '/assets/characters/bang/full.png',
    },
    theme: {
      primaryColor: '#7A8288',
      secondaryColor: '#2F3E46',
    },
    moves: {
      rock: { label: 'Water Stream Rock Smashing Fist', animationId: 'bang_rock', vfx: 'blue-water-trails', sfx: 'water_flow_impact.mp3' },
      paper: { label: 'Flowing Palm Guard', animationId: 'bang_paper', vfx: 'ripple-shield', sfx: 'martial_block.mp3' },
      scissors: { label: 'Fist of Twin Fangs', animationId: 'bang_scissors', vfx: 'cross-slashes', sfx: 'fast_chopping.mp3' }
    },
    isActive: true
  },
  {
    slug: 'fubuki',
    name: 'Blizzard of Hell (Fubuki)',
    title: 'B-Class Rank 1 Hero',
    tagline: 'I will make the Blizzard Group number one.',
    tier: 'B',
    avatar: {
      thumbnail: '/assets/characters/fubuki/avatar.png',
      fullBody: '/assets/characters/fubuki/full.png',
    },
    theme: {
      primaryColor: '#0B5248',
      secondaryColor: '#FFFFFF',
    },
    moves: {
      rock: { label: 'Gravity Press', animationId: 'fubuki_rock', vfx: 'teal-vortex', sfx: 'heavy_gravity.mp3' },
      paper: { label: 'Barrier Wall', animationId: 'fubuki_paper', vfx: 'hex-grid-shield', sfx: 'shield_activate.mp3' },
      scissors: { label: 'Esper Blade Flurry', animationId: 'fubuki_scissors', vfx: 'flying-shards', sfx: 'glass_shattering.mp3' }
    },
    isActive: true
  }
];

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/opm_rps';
  console.log(`Connecting to MongoDB at: ${uri}`);
  
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB. Starting seed...');
    
    // Clear existing characters
    await Character.deleteMany({});
    console.log('Cleared existing characters.');
    
    // Insert new roster
    const docs = await Character.insertMany(charactersData);
    console.log(`Successfully seeded ${docs.length} characters.`);
  } catch (error) {
    console.error('Error seeding characters:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

seed();
