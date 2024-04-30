export interface MenuItem{
  id: number;
  parentId?: number;
  text: string;
  path?: string;
  icon?: string;
  pathIcon?: string;
  isAssetMandatory?: boolean;
}

export const navigation = [
  {
    id: 1,
    text: 'Home',
    path: '/home',
    icon: 'home'
  },
  {
    id: 2,
    text: 'VCCS VHF',
    path: '/vccs-vhf',
    icon: 'globe'
  },
  {
    id: 7,
    text: 'VCCS TF',
    path: '/vccs-tf',
    icon: 'globe'
  },
  {
    id: 3,
    text: 'Products',
    path: '/products',
    icon: 'money'
  },
  {
    id: 4,
    text: 'Examples',
    icon: 'folder',
  },
    {
      id: 5,
      parentId: 4,
      text: 'Infos',
      icon: 'info',
    },
    {
      id: 6,
      parentId: 4,
      text: 'Preferences',
      icon: 'preferences',
    },
];
