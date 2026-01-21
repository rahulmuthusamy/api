module.export = {
  ROLE_PERMISSIONS: {
    SA: {
      accessAll: true
    },
    Admin: {
      pages: {
        registration: ['create', 'read', 'update', 'delete'
        ],
        userRegistration: ['create', 'read', 'update', 'delete'
        ],
        patientRegistration: ['read', 'update', 'delete'
        ],
      }
    },
    FrontDesk: {
      pages: {
        registration: ['read'
        ]
      }
    }
  }
}