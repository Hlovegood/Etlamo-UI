// Illustrative inventory. Replace through the data adapter when venue onboarding is ready.
const pair = (en, ar) => ({ en, ar });
export const guestCounts = [10, 20, 30, 50, 75, 100, 150, 200, 250, 300, 350, 400, 500, 600];
export const eventTypes = ['wedding', 'engagement', 'henna', 'conference', 'other'];
export const venueKinds = ['garden', 'ballroom', 'courtyard', 'conferenceRoom', 'conferenceHall'];
export const conferenceKinds = ['conferenceRoom', 'conferenceHall'];
export const venueAmenities = ['parking', 'bridalRoom', 'outdoor', 'indoor', 'catering', 'accessible', 'wifi', 'projector'];
export const packageInclusions = ['spaceHire', 'tables', 'sound', 'decor', 'catering', 'wifi', 'projector'];
export const sessions = ['afternoon', 'evening'];
export const venues = [
  {
    id: 'olive-garden', name: pair('The Olive Garden Estate', 'حدائق الزيتون الملكية'), area: 'nasr-west', kind: 'garden', theme: 'garden',
    description: pair('Century-old botanical olive groves, royal bridal pavilions, and climate-controlled glasshouses for milestone galas.', 'حدائق زيتون معمرة وأجنحة ملكية وصوبة زجاجية مكيفة لأرقى حفلات الزفاف والمناسبات الكبرى.'),
    amenities: ['parking', 'bridalRoom', 'outdoor', 'indoor', 'catering'],
    spaces: [{ id: 'garden', name: pair('The Royal Olive Lawn', 'المسطح الأخضر الملكي'), capacity: 280 }, { id: 'courtyard', name: pair('The Glasshouse Pavilion', 'صوبة البافيليون الزجاجية'), capacity: 100 }],
    packages: [{ id: 'essential', name: pair('Essential Heritage Gala', 'باقة التراث الأساسية'), price: 108000, includes: ['spaceHire', 'tables', 'sound'] }, { id: 'celebration', name: pair('Royal Emerald Experience', 'تجربة الزمرد الملكية الشاملة'), price: 145000, includes: ['spaceHire', 'tables', 'sound', 'decor'] }],
  },
  {
    id: 'nile-salon', name: pair('Nile Royal Waterfront Ballroom', 'قاعة النيل الملكية الكبرى'), area: 'garden-city', kind: 'ballroom', theme: 'coral',
    description: pair('A magnificent salon with panoramic Nile views, gilded stucco ceilings, and private yacht promenade access.', 'قاعة تاريخية فخمة بنقوش مذهبة وإطلالة بانورامية ساحرة على النيل مع مرسى يخوت خاص.'),
    amenities: ['parking', 'bridalRoom', 'indoor', 'accessible', 'catering'],
    spaces: [{ id: 'ballroom', name: pair('Grand Imperial Ballroom', 'القاعة الإمبراطورية الكبرى'), capacity: 600 }, { id: 'salon', name: pair('Royal Nile Salon', 'صالون النيل الملكي'), capacity: 150 }],
    packages: [{ id: 'essential', name: pair('Imperial Nile Evening', 'أمسية النيل الإمبراطورية'), price: 72000, includes: ['spaceHire', 'tables', 'sound'] }, { id: 'celebration', name: pair('Royal Gala Celebration', 'احتفال الجالا الملكي'), price: 120000, includes: ['spaceHire', 'tables', 'sound', 'decor'] }],
  },
  {
    id: 'azure-court', name: pair('Azure Fountain Court', 'فناء اللازورد والنوافير الملكية'), area: 'heliopolis', kind: 'courtyard', theme: 'blue',
    description: pair('Marble colonnades, cascading water fountains, and an aristocratic courtyard setting for distinguished celebrations.', 'أعمدة رخامية تاريخية ونوافير متدرجة وفناء أثري دافئ للمناسبات والأفراح الراقية.'),
    amenities: ['bridalRoom', 'outdoor', 'indoor', 'catering', 'parking'],
    spaces: [{ id: 'court', name: pair('The Colonnade Court', 'ساحة الأعمدة الرخامية'), capacity: 260 }, { id: 'room', name: pair('The Azure Salon', 'صالون اللازورد الخاص'), capacity: 100 }],
    packages: [{ id: 'essential', name: pair('Sunset Fountain Package', 'باقة غروب النوافير'), price: 90000, includes: ['spaceHire', 'tables', 'sound'] }, { id: 'celebration', name: pair('Azure Grand Celebration', 'احتفال اللازورد الفاخر'), price: 130000, includes: ['spaceHire', 'tables', 'sound', 'decor'] }],
  },
  {
    id: 'cairo-meeting-house', name: pair('Cairo Executive Meeting House', 'دار القاهرة للاجتماعات والندوات'), area: 'downtown', kind: 'conferenceRoom', theme: 'conference',
    description: pair('High-spec executive conference center featuring breakout seminar rooms, hybrid audio systems, high-speed fiber, and 4K projection.', 'مركز مؤتمرات تنفيذي مجهز بالكامل يضم قاعات ندوات هجينة وشاشات 4K وإنترنت فائق السرعة للاجتماعات الرسمية.'),
    amenities: ['indoor', 'accessible', 'wifi', 'projector', 'parking'],
    spaces: [{ id: 'meeting-room', name: pair('Diplomatic Boardroom', 'قاعة الاجتماعات الدبلوماسية'), capacity: 30, kind: 'conferenceRoom' }, { id: 'main-hall', name: pair('Plenary Seminar Hall', 'قاعة الندوات العامة'), capacity: 150, kind: 'conferenceHall' }],
    packages: [{ id: 'meeting', name: pair('Executive Session (Half Day)', 'جلسة تنفيذية (نصف يوم)'), price: 12000, includes: ['spaceHire', 'wifi', 'projector'] }, { id: 'full-day', name: pair('Full Day Convention Package', 'باقة المؤتمر الكاملة'), price: 24000, includes: ['spaceHire', 'tables', 'sound', 'wifi', 'projector'] }],
  },
  {
    id: 'summit-ballroom', name: pair('Summit Plenary Convention Center', 'مركز قمم المؤتمرات الكبرى'), area: 'sheikh-zayed', kind: 'conferenceHall', theme: 'conference',
    description: pair('Acoustic timber wave ceilings, curved 8K LED presentation wall and diplomatic convention suites. Full UN protocol and simultaneous interpretation facilities.', 'أسقف خشبية عازلة للصوت وشاشات منحنية 8K للمؤتمرات الدولية وقاعات كبار الزوار وتجهيزات الترجمة الفورية الكاملة.'),
    amenities: ['parking', 'indoor', 'accessible', 'wifi', 'projector'],
    spaces: [{ id: 'plenary', name: pair('Grand Plenary Auditorium', 'القاعة العامة الكبرى للمؤتمرات'), capacity: 800, kind: 'conferenceHall' }, { id: 'boardroom', name: pair('Executive Summit Boardroom', 'قاعة اجتماعات القمة'), capacity: 50, kind: 'conferenceRoom' }],
    packages: [{ id: 'summit-day', name: pair('International Summit Package', 'باقة القمم والمؤتمرات الدولية'), price: 290000, includes: ['spaceHire', 'tables', 'sound', 'wifi', 'projector'] }],
  },
  {
    id: 'pyramids-terrace', name: pair('Pyramids Heritage Terrace', 'شرفة الأهرامات التراثية'), area: 'haram', kind: 'garden', theme: 'garden',
    description: pair('An awe-inspiring open-air plateau venue offering uninterrupted panoramic views of the Giza Pyramids. The pinnacle of Egyptian grandeur for milestone galas and weddings.', 'موقع ساحر على هضبة الأهرامات بإطلالة مباشرة وغير محجوبة على عجائب الجيزة عند الغروب. ذروة الفخامة لحفلات الزفاف والمناسبات الكبرى.'),
    amenities: ['parking', 'bridalRoom', 'outdoor', 'catering'],
    spaces: [{ id: 'horizon-lawn', name: pair('Great Horizon Plateau Lawn', 'مسطح الأفق الملكي المفتوح'), capacity: 850 }, { id: 'glass-pavilion', name: pair('Royal Glass Pavilion', 'البافيليون الزجاجي الفاخر'), capacity: 250 }],
    packages: [{ id: 'monumental', name: pair('Royal Monument Gala Experience', 'تجربة الأفق الملكي التاريخية'), price: 310000, includes: ['spaceHire', 'tables', 'sound', 'decor'] }],
  }
];
export const findVenue = id => venues.find(venue => venue.id === id);
export const capacityOf = venue => Math.max(...venue.spaces.map(space => space.capacity));
export const startingPrice = venue => Math.min(...venue.packages.map(pkg => pkg.price));
