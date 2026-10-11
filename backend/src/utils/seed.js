import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Post } from '../models/Post.js';
import { Comment } from '../models/Comment.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { Tag } from '../models/Tag.js';
import { generateUniqueSlug } from './slug.js';

const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/blog_management_db';

export const seedDatabase = async () => {
  try {
    console.log('[Seeder] Connecting to database:', dbUri);
    await mongoose.connect(dbUri);

    console.log('[Seeder] Clearing old records...');
    await Promise.all([
      User.deleteMany({}),
      Post.deleteMany({}),
      Comment.deleteMany({}),
      ActivityLog.deleteMany({}),
      Tag.deleteMany({}),
    ]);

    console.log('[Seeder] Creating users...');
    const admin = new User({
      name: 'System Administrator',
      email: 'admin@example.com',
      password: 'Admin@123456',
      role: 'admin',
      bio: 'Full-stack system administrator overseeing platform moderation, analytics, and security.',
    });
    await admin.save();

    const john = new User({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'User@123456',
      role: 'user',
      bio: 'Frontend Architect passionate about React 19, web performance, and modern CSS.',
    });
    await john.save();

    const jane = new User({
      name: 'Jane Smith',
      email: 'jane@example.com',
      password: 'User@123456',
      role: 'user',
      bio: 'Cloud Engineer and Node.js core enthusiast passionate about microservices and scalable backends.',
    });
    await jane.save();

    console.log('[Seeder] Creating platform tags...');
    const tagNames = ['react', 'nodejs', 'architecture', 'security', 'mongodb', 'performance'];
    const tags = await Promise.all(
      tagNames.map((name) => Tag.create({ name }))
    );

    console.log('[Seeder] Creating articles...');
    const articlesData = [
      {
        title: 'Mastering the MERN Stack: From Clean Architecture to Production',
        content: `Building scalable modern web applications requires a deliberate separation of concerns. In traditional Express applications, route handlers often mix database queries, business rules, and HTTP serialization.\n\n### The Service Layer Pattern\nBy introducing a dedicated **Service Layer**, controllers remain lean and purely responsible for:\n1. Parsing and validating HTTP inputs (via Zod or Joi)\n2. Calling business domain services\n3. Sending standardized responses\n\n\`\`\`javascript\n// controller.js\nconst post = await PostService.createPost(req.body, req.user.id);\nreturn ApiResponse.created(res, 'Post created', { post });\n\`\`\`\n\nThis keeps your domain logic decoupled from Express, making unit and integration testing significantly faster and more maintainable.`,
        author: john._id,
        tags: ['architecture', 'nodejs', 'mongodb'],
        coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&q=80',
        readTime: 5,
        isDeleted: false,
      },
      {
        title: 'Securing REST APIs with JWT Access and Refresh Tokens',
        content: `JSON Web Tokens (JWT) are the standard for stateless authentication in modern distributed web systems. However, storing long-lived JWTs in localStorage exposes users to Cross-Site Scripting (XSS) token theft.\n\n### The Dual-Token Strategy\n- **Access Tokens**: Short-lived (10-15 minutes). Sent in the \`Authorization: Bearer <token>\` header. If intercepted, the blast radius is minimal.\n- **Refresh Tokens**: Long-lived (7 days). Stored in an **HttpOnly**, **Secure**, and **SameSite=Lax** cookie. Inaccessible to JavaScript, defending against client-side script injection.\n\nWhen the access token expires, an Axios response interceptor seamlessly invokes \`/api/v1/auth/refresh\`, rotates the tokens, and retries the original request without disrupting the user experience.`,
        author: admin._id,
        tags: ['security', 'nodejs'],
        coverImage: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1200&q=80',
        readTime: 6,
        isDeleted: false,
      },
      {
        title: 'React 19 Deep Dive: Server Components and Optimistic UI',
        content: `React 19 introduces major enhancements to developer ergonomic workflows and client-side performance.\n\n### What Makes React 19 Special?\n- **Automatic Memoization**: The React Compiler reduces the need for manual \`useMemo\` and \`useCallback\` calls.\n- **Actions and useActionState**: Simplified stateful form handling with built-in pending states.\n- **useOptimistic**: Instant client feedback before the server responds.\n\nPairing React 19 with a robust Vite build pipeline delivers lightning-fast hot module reloading and sub-second bundle builds.`,
        author: john._id,
        tags: ['react', 'performance'],
        coverImage: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1200&q=80',
        readTime: 4,
        isDeleted: false,
      },
      {
        title: 'High-Performance MongoDB Indexing and Query Optimization',
        content: `As datasets grow into millions of documents, unindexed queries cause full collection scans that saturate memory and CPU.\n\n### Essential Indexing Rules\n1. **Equality, Sort, Range (ESR)**: Design compound indexes by filtering on equality fields first, sort keys second, and ranges last.\n2. **Text Indexes**: Leverage MongoDB text indexes for multi-field search.\n3. **Projection**: Always project only required fields using \`.select('name email avatar')\` to minimize wire transfer and serialization overhead.\n\nUsing lean queries (\`.lean()\`) skips Mongoose document hydration, boosting throughput by up to 4x on read-heavy blog endpoints.`,
        author: jane._id,
        tags: ['mongodb', 'performance', 'architecture'],
        coverImage: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=1200&q=80',
        readTime: 7,
        isDeleted: false,
      },
      {
        title: 'Real-Time Notifications with Socket.IO in Distributed Systems',
        content: `User engagement flourishes when interactions feel immediate. Socket.IO provides resilient bi-directional event transport with automatic WebSocket fallback.\n\n### Room-Based Targeted Delivery\nRather than broadcasting events globally, users join personalized rooms upon connection:\n\`\`\`javascript\nsocket.join(\`user:\${userId}\`);\n\`\`\`\nWhen another member comments on an article, the server emits a \`notification:comment\` event exclusively to that room.\n\nThe client listens through React context and renders a lightweight toast notification in real time.`,
        author: jane._id,
        tags: ['nodejs', 'react'],
        coverImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=80',
        readTime: 5,
        isDeleted: false,
      },
      {
        title: 'Draft or Archived Article (Soft-Deleted Demonstration)',
        content: `This article was soft-deleted to showcase the platform's non-destructive deletion model.\n\nAdmins can review this post in the dedicated Admin Panel (/admin/posts) under the "Soft-Deleted Only" filter and restore it with a single click.`,
        author: john._id,
        tags: ['architecture'],
        coverImage: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200&q=80',
        readTime: 2,
        isDeleted: true,
        deletedAt: new Date(),
      },
    ];

    const posts = [];
    for (const data of articlesData) {
      const slug = await generateUniqueSlug(Post, data.title);
      const post = new Post({ ...data, slug });
      await post.save();
      posts.push(post);
    }

    console.log('[Seeder] Creating comments...');
    const commentsData = [
      {
        post: posts[0]._id,
        author: jane._id,
        content: 'Spot-on explanation of the Service Layer pattern. Separating business logic from Express routes made our team test suite 5x faster.',
      },
      {
        post: posts[0]._id,
        author: admin._id,
        content: 'Great article! Adhering to clean architecture ensures smooth scaling when transitioning between database schemas.',
      },
      {
        post: posts[1]._id,
        author: john._id,
        content: 'HttpOnly cookies for refresh tokens are a non-negotiable security requirement. Glad to see this covered thoroughly.',
      },
      {
        post: posts[2]._id,
        author: jane._id,
        content: 'React 19 Actions and the React Compiler have drastically cut down boilerplate in our forms.',
      },
    ];

    await Comment.insertMany(commentsData);

    console.log('[Seeder] Logging initial administrative activities...');
    await ActivityLog.insertMany([
      {
        action: 'SYSTEM_SEED',
        user: admin._id,
        userEmail: admin.email,
        ip: '127.0.0.1',
        userAgent: 'SeederScript/1.0',
        details: { message: 'Database initialized with demo accounts and articles.' },
      },
      {
        action: 'USER_REGISTER',
        user: john._id,
        userEmail: john.email,
        ip: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        details: { role: 'user' },
      },
      {
        action: 'USER_REGISTER',
        user: jane._id,
        userEmail: jane.email,
        ip: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        details: { role: 'user' },
      },
      {
        action: 'POST_CREATE',
        user: john._id,
        userEmail: john.email,
        ip: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        details: { title: articlesData[0].title },
      },
    ]);

    console.log('==================================================');
    console.log(' Seeder completed successfully!');
    console.log('--------------------------------------------------');
    console.log(' Admin Account:');
    console.log('   Email:    admin@example.com');
    console.log('   Password: Admin@123456');
    console.log('--------------------------------------------------');
    console.log(' Regular User 1:');
    console.log('   Email:    john@example.com');
    console.log('   Password: User@123456');
    console.log('--------------------------------------------------');
    console.log(' Regular User 2:');
    console.log('   Email:    jane@example.com');
    console.log('   Password: User@123456');
    console.log('==================================================');
  } catch (error) {
    console.error('Seeder failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
};

export const seedAdmin = seedDatabase;

if (process.argv[1]?.endsWith('seed.js')) {
  seedDatabase();
}
