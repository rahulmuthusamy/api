module.exports = {
  ROLE_PERMISSIONS: {
    super_admin: {
      accessAll: true
    },
    owner: {
      pages: {
        auctionSession: ['read'],
        teams: ['read', 'update'],
        players: ['read'],
        auctionBids: ['create', 'read']
      }
    },
    player: {
      pages: {
        players: ['read', 'update']
      }
    },
    member: {
      pages: {
        auctionSession: ['read'],
        teams: ['read'],
        players: ['read']
      }
    }
  }
};