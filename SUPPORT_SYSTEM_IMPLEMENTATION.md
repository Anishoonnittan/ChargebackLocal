# Help & Support System Implementation Plan

## ✅ Database Schema Complete

The Convex schema has been updated with 4 new tables for the ticket-based support system:

### 1. **supportTickets**
- Ticket number (auto-generated: TICKET-001234)
- Subject, description, category, priority
- Status tracking (OPEN, IN_PROGRESS, WAITING_FOR_CUSTOMER, RESOLVED, CLOSED)
- Assignment to support agents
- App context (scamvigil | chargeback)
- Attachments support
- Response metrics (first response time, resolution time)
- Customer satisfaction ratings (1-5 stars)

### 2. **ticketReplies**
- Conversation thread for each ticket
- Author tracking (CUSTOMER, SUPPORT_AGENT, SYSTEM)
- Internal notes (not visible to customers)
- Attachments per reply
- Status change tracking
- Read receipts

### 3. **supportCategories**
- Organize tickets by category
- Auto-assignment rules
- Default priority settings
- Stats tracking (ticket count, avg resolution time)
- App-specific or shared categories

### 4. **cannedResponses**
- Quick replies for support agents
- Usage tracking
- Category organization
- App-specific or shared responses

---

## 🎯 Next Steps: UI Implementation

### Phase 1: User-Facing Screens (Both Apps)

#### 1. **HelpCenterScreen.tsx**
- Browse support categories
- Search knowledge base
- "Contact Support" button
- Recent tickets list
- FAQ section

#### 2. **CreateTicketScreen.tsx**
- Subject input
- Description textarea
- Category selector
- Priority selector (auto-set based on category)
- Attachment upload
- Submit button

#### 3. **TicketListScreen.tsx**
- List all user's tickets
- Filter by status (Open, In Progress, Resolved, Closed)
- Sort by date, priority
- Ticket cards showing:
- Ticket number
- Subject
- Status badge
- Last updated
- Unread replies indicator

#### 4. **TicketDetailScreen.tsx**
- Full ticket conversation
- Reply input
- Attachment upload
- Status indicator
- Timestamp for each message
- "Mark as Resolved" button
- Rating prompt when resolved

### Phase 2: Admin Screens (App Owner Only)

#### 5. **AdminSupportDashboardScreen.tsx**
- Overview metrics:
- Open tickets count
- Avg response time
- Avg resolution time
- Customer satisfaction score
- Recent tickets list
- Filters (app, status, priority, assigned to)

#### 6. **AdminTicketDetailScreen.tsx**
- Full ticket view
- Internal notes section
- Assign to agent
- Change status
- Change priority
- Canned responses selector
- Reply as agent

#### 7. **CannedResponsesScreen.tsx**
- List all canned responses
- Create/edit/delete
- Category organization
- Usage stats

---

## 📱 Navigation Integration

### ScamVigil (Consumer App)
```
More Tab → Settings → HELP Section → Help & Support
```

### ChargebackShield (Business App)
```
More Tab → Settings → HELP Section → Help & Support
```

### Admin Panel (Both Apps)
```
More Tab → Settings → ADMIN Section → Admin Panel → Support
```

---

## 🔧 Convex Functions Needed

### Mutations
1. `createTicket` - Create new support ticket
2. `replyToTicket` - Add reply to ticket
3. `updateTicketStatus` - Change ticket status
4. `assignTicket` - Assign ticket to agent
5. `rateTicket` - Customer satisfaction rating
6. `createCannedResponse` - Add canned response
7. `updateCannedResponse` - Edit canned response

### Queries
1. `getUserTickets` - Get all tickets for a user
2. `getTicketById` - Get single ticket with replies
3. `getAllTickets` - Admin: Get all tickets (filtered)
4. `getTicketStats` - Admin: Get metrics
5. `getCannedResponses` - Get canned responses by category
6. `getSupportCategories` - Get all categories

---

## 🎨 Design Considerations

### User Experience
- **Fast response times** - Show estimated response time
- **Real-time updates** - New replies appear instantly
- **Push notifications** - Alert when agent replies
- **Email notifications** - Send email for new replies
- **Attachment support** - Images, PDFs, screenshots
- **Search** - Find tickets by keyword

### Admin Experience
- **Bulk actions** - Close multiple tickets at once
- **Keyboard shortcuts** - Quick navigation
- **Auto-assignment** - Route tickets to right agent
- **SLA tracking** - Monitor response/resolution times
- **Canned responses** - Quick replies for common issues

---

## 📊 Metrics to Track

1. **Response Time** - Time to first agent reply
2. **Resolution Time** - Time to close ticket
3. **Customer Satisfaction** - Average rating
4. **Ticket Volume** - Tickets per day/week/month
5. **Category Distribution** - Most common issues
6. **Agent Performance** - Tickets handled, avg resolution time

---

## 🚀 Implementation Priority

### High Priority (Week 1)
1. CreateTicketScreen
2. TicketListScreen
3. TicketDetailScreen
4. Basic Convex mutations/queries

### Medium Priority (Week 2)
1. HelpCenterScreen
2. AdminSupportDashboardScreen
3. AdminTicketDetailScreen
4. Push notifications

### Low Priority (Week 3)
1. CannedResponsesScreen
2. Advanced filtering
3. Analytics dashboard
4. Email notifications

---

## 💡 Future Enhancements

1. **Live Chat** - Real-time chat with agents
2. **AI Assistant** - Auto-suggest solutions
3. **Video Support** - Screen sharing for complex issues
4. **Multi-language** - Support in multiple languages
5. **Knowledge Base** - Self-service articles
6. **Community Forum** - User-to-user help

---

**Status:** Schema complete ✅ | UI pending ⏳ | Convex functions pending ⏳

**Estimated Time:** 2-3 weeks for full implementation
