---
marp: true
theme: polling
class: lead
paginate: true
---

<!-- _class: title -->

# 🎉 Interactive Presentation

## Live Polling Demo with NestJS

**Get your phones ready!**

---

<!-- _class: poll -->

# 💻 Programming Languages

## What's your favorite programming language?

**Options:** JavaScript • Python • Java • C++ • Other

![QR Code](http://localhost:3000/api/qr/poll-1)

<script>
// Auto-start poll when this slide is displayed
fetch('http://localhost:3000/api/poll/start?question=What\'s your favorite programming language?&options=JavaScript,Python,Java,C++,Other')
  .then(response => response.json())
  .then(data => console.log('Poll started:', data))
  .catch(error => console.error('Failed to start poll:', error));
</script>

---

<!-- _class: results -->

# 📊 Programming Language Results

Visit the presenter interface to see live results!

**Admin Panel:** [http://localhost:3000/admin](http://localhost:3000/admin)

---

<!-- _class: poll -->

# 📚 Learning Preferences

## How do you prefer to learn new technologies?

**Options:** Online Courses • Books • Tutorials • Practice Projects • Bootcamps

![QR Code](http://localhost:3000/api/qr/poll-2)

<script>
// Auto-start second poll
fetch('http://localhost:3000/api/poll/start?question=How do you prefer to learn new technologies?&options=Online Courses,Books,Tutorials,Practice Projects,Bootcamps')
  .then(response => response.json())
  .then(data => console.log('Poll 2 started:', data))
  .catch(error => console.error('Failed to start poll 2:', error));
</script>

---

<!-- _class: results -->

# 📚 Learning Method Results

Visit the presenter interface to see live results!

**Admin Panel:** [http://localhost:3000/admin](http://localhost:3000/admin)

---

<!-- _class: conclusion -->

# 🙏 Thank You!

## Thanks for participating in our live polling demo!

### Built with:
- **NestJS** - Backend framework
- **TypeScript** - Type safety
- **Handlebars** - Clean templating
- **Marp** - Beautiful slides
- **Socket.IO** - Real-time updates