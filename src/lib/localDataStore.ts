import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CheckpointProgress,
  Event,
  EventRegistration,
  EventWindow,
  Profile,
  RosterEntry,
  RouteDoc,
  TimestampString,
  User,
} from '../types';
import { Checkpoint, GeofenceEvent } from '../modules/geofence/types';

/**
 * LocalDataStore provides a minimal persistence layer backed by AsyncStorage.
 * It replaces the old Firebase integration so the app can operate without
 * remote dependencies. The store seeds sensible demo data on first launch and
 * exposes helpers used across the app for authentication, events and profiles.
 */
class LocalDataStore {
  private static readonly INIT_KEY = 'lds_initialised_v1';
  private static readonly USERS_KEY = 'lds_users';
  private static readonly PROFILES_KEY = 'lds_profiles';
  private static readonly EVENTS_KEY = 'lds_events';
  private static readonly ROUTES_KEY = 'lds_routes';
  private static readonly REGISTRATIONS_KEY = 'lds_event_registrations';
  private static readonly CHECKPOINTS_KEY = 'lds_checkpoints';
  private static readonly CHECKPOINT_LOGS_KEY = 'lds_checkpoint_logs';
  private static readonly CHECKPOINT_PROGRESS_KEY = 'lds_checkpoint_progress';
  private static readonly SLUG_INDEX_KEY = 'lds_slug_index';

  private initialised = false;

  private async ensureInitialised(): Promise<void> {
    if (this.initialised) {
      return;
    }

    const alreadyInitialised = await AsyncStorage.getItem(LocalDataStore.INIT_KEY);
    if (!alreadyInitialised) {
      await this.seedDefaults();
      await AsyncStorage.setItem(LocalDataStore.INIT_KEY, 'true');
    }

    this.initialised = true;
  }

  private async seedDefaults(): Promise<void> {
    const now = new Date();
    const nowIso = now.toISOString();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const window: EventWindow = {
      start: nowIso,
      end: new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString(),
    };

    const defaultUser: StoredUserRecord = {
      uid: 'demo-user',
      email: 'demo@qrider.app',
      displayName: 'Demo Rider',
      photoURL: undefined,
      slug: 'demo-rider',
      createdAt: nowIso,
      updatedAt: nowIso,
      password: 'demo123',
    };

    const defaultProfile: Profile = {
      uid: defaultUser.uid,
      fullName: 'Demo Rider',
      nickname: 'Demo',
      primaryPhone: '8095551234',
      secondaryPhone: '8095555678',
      contacts: [
        {
          id: 'contact-1',
          name: 'Contacto Emergencia',
          relationship: 'Hermano',
          phone: '8095556789',
          whatsapp: true,
        },
      ],
      allergies: '<ul><li>Polen</li></ul>',
      medications: '<ul><li>Ibuprofeno 400mg</li></ul>',
      medicalNotes: 'Sin condiciones crónicas registradas.',
      dateOfBirth: '1990-05-12',
      nationalId: '001-1234567-8',
      bloodType: 'O+',
      preferences: {
        showBloodTypePublic: true,
        showMedicalNotes: true,
      },
      address: {
        country: 'República Dominicana',
        state: 'Distrito Nacional',
        city: 'Santo Domingo',
      },
      aeroAmbulance: {
        enrolled: true,
        provider: 'Helidosa',
        memberId: 'HA-12345',
        phone: '8092001234',
      },
      preferredCare: {
        clinicName: 'Centro Médico Demo',
        doctorName: 'Dra. González',
        doctorPhone: '8095551122',
        city: 'Santo Domingo',
      },
      insurances: [
        {
          provider: 'ARS Universal',
          planName: 'Platinum',
          policyNumber: 'PLT-987654',
          isPrimary: true,
        },
      ],
      bike: {
        brand: 'Yamaha',
        model: 'MT-07',
        color: 'Azul',
        plate: 'A123456',
        insurance: {
          company: 'Seguros La Colonial',
          policy: 'MOTO-2024-01',
          expiry: '2026-01-01',
        },
      },
      updatedAt: nowIso,
    };

    const defaultEvent: Event = {
      id: 'event-demo',
      title: 'Ruta costera demostración',
      date: tomorrow.toISOString().split('T')[0],
      startTime: '08:00',
      meetingPoint: {
        text: 'Parque Mirador Sur, Santo Domingo',
        lat: 18.4423,
        lng: -69.9593,
        mapUrl: 'https://maps.google.com/?q=Parque+Mirador+Sur',
      },
      difficulty: 'easy',
      notes: 'Evento de demostración sin backend. Únete para explorar la experiencia QRider.',
      createdBy: defaultUser.uid,
      joinMode: 'public',
      multipleRoutes: true,
      capacity: 50,
      window,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const defaultRoutes: RouteDoc[] = [
      {
        id: 'route-demo-1',
        name: 'Ruta turística',
        description: 'Recorrido panorámico por el malecón.',
        eventId: defaultEvent.id,
        active: true,
      },
      {
        id: 'route-demo-2',
        name: 'Ruta exprés',
        description: 'Trayecto directo para llegar rápido al destino final.',
        eventId: defaultEvent.id,
        active: true,
      },
    ];

    const defaultCheckpoints: Record<string, Checkpoint[]> = {
      [defaultEvent.id]: [
        {
          id: 'cp-1',
          name: 'Mirador Sur - Entrada Este',
          latitude: 18.4428,
          longitude: -69.9521,
          radius: 120,
          notify_on_enter: true,
          notify_on_exit: true,
          sequence: 0,
          active: true,
          event_id: defaultEvent.id,
          routeId: 'route-demo-1',
          created_at: nowIso,
          updated_at: nowIso,
        },
        {
          id: 'cp-2',
          name: 'Playa Guibia',
          latitude: 18.4543,
          longitude: -69.9112,
          radius: 120,
          notify_on_enter: true,
          notify_on_exit: true,
          sequence: 1,
          active: true,
          event_id: defaultEvent.id,
          routeId: 'route-demo-1',
          created_at: nowIso,
          updated_at: nowIso,
        },
        {
          id: 'cp-3',
          name: 'Faro a Colón',
          latitude: 18.4795,
          longitude: -69.8769,
          radius: 140,
          notify_on_enter: true,
          notify_on_exit: true,
          sequence: 2,
          active: true,
          event_id: defaultEvent.id,
          routeId: 'route-demo-2',
          created_at: nowIso,
          updated_at: nowIso,
        },
      ],
    };

    const defaultRoster: RosterEntry = {
      fullName: defaultProfile.fullName,
      bloodType: defaultProfile.bloodType ?? null,
      publicSlug: defaultUser.slug,
      publicUrl: null,
      avatarUrl: null,
    };

    const defaultRegistrations: EventRegistration[] = [
      {
        id: `${defaultEvent.id}_${defaultUser.uid}`,
        eventId: defaultEvent.id,
        uid: defaultUser.uid,
        routeId: 'route-demo-1',
        status: 'going',
        consentEmergencyShare: true,
        rosterEntry: defaultRoster,
        createdAt: nowIso,
        updatedAt: nowIso,
      },
    ];

    await AsyncStorage.multiSet([
      [LocalDataStore.USERS_KEY, JSON.stringify([defaultUser])],
      [LocalDataStore.PROFILES_KEY, JSON.stringify([defaultProfile])],
      [LocalDataStore.EVENTS_KEY, JSON.stringify([defaultEvent])],
      [LocalDataStore.ROUTES_KEY, JSON.stringify(defaultRoutes)],
      [LocalDataStore.REGISTRATIONS_KEY, JSON.stringify(defaultRegistrations)],
      [LocalDataStore.CHECKPOINTS_KEY, JSON.stringify(defaultCheckpoints)],
      [LocalDataStore.CHECKPOINT_LOGS_KEY, JSON.stringify({})],
      [LocalDataStore.CHECKPOINT_PROGRESS_KEY, JSON.stringify({})],
      [LocalDataStore.SLUG_INDEX_KEY, JSON.stringify({ [defaultUser.slug]: defaultUser.uid })],
    ]);
  }

  private async read<T>(key: string, fallback: T): Promise<T> {
    await this.ensureInitialised();
    const raw = await AsyncStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    try {
      return JSON.parse(raw) as T;
    } catch (error) {
      console.warn(`LocalDataStore: failed to parse ${key}`, error);
      return fallback;
    }
  }

  private async write<T>(key: string, value: T): Promise<void> {
    await this.ensureInitialised();
    await AsyncStorage.setItem(key, JSON.stringify(value));
  }

  private toPublicUser(record: StoredUserRecord): User {
    return {
      uid: record.uid,
      email: record.email,
      displayName: record.displayName,
      photoURL: record.photoURL,
      slug: record.slug,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  private async ensureUniqueSlug(base: string): Promise<string> {
    const slugIndex = await this.read<Record<string, string>>(LocalDataStore.SLUG_INDEX_KEY, {});
    let slug = base;
    let counter = 1;
    while (slugIndex[slug]) {
      counter += 1;
      slug = `${base}-${counter}`;
    }

    slugIndex[slug] = '';
    await this.write(LocalDataStore.SLUG_INDEX_KEY, slugIndex);
    return slug;
  }

  private async reserveSlug(slug: string, uid: string): Promise<void> {
    const slugIndex = await this.read<Record<string, string>>(LocalDataStore.SLUG_INDEX_KEY, {});
    slugIndex[slug] = uid;
    await this.write(LocalDataStore.SLUG_INDEX_KEY, slugIndex);
  }

  // #region Users
  async registerUser(params: { email: string; password: string; displayName: string; photoURL?: string }): Promise<User> {
    const users = await this.read<StoredUserRecord[]>(LocalDataStore.USERS_KEY, []);
    const exists = users.find(u => u.email.toLowerCase() === params.email.toLowerCase());
    if (exists) {
      throw new Error('auth/email-already-in-use');
    }

    const nowIso = new Date().toISOString();
    const candidateSlug = this.slugFromDisplayName(params.displayName || params.email);
    const slug = await this.ensureUniqueSlug(candidateSlug);

    const record: StoredUserRecord = {
      uid: this.randomId('user'),
      email: params.email.trim().toLowerCase(),
      displayName: params.displayName || params.email,
      photoURL: params.photoURL,
      slug,
      createdAt: nowIso,
      updatedAt: nowIso,
      password: params.password,
    };

    users.push(record);
    await this.write(LocalDataStore.USERS_KEY, users);
    await this.reserveSlug(slug, record.uid);

    return this.toPublicUser(record);
  }

  async authenticate(email: string, password: string): Promise<User> {
    const users = await this.read<StoredUserRecord[]>(LocalDataStore.USERS_KEY, []);
    const match = users.find(
      u => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password,
    );
    if (!match) {
      throw new Error('auth/invalid-credential');
    }
    return this.toPublicUser(match);
  }

  async findUserByEmail(email: string): Promise<User | null> {
    const users = await this.read<StoredUserRecord[]>(LocalDataStore.USERS_KEY, []);
    const match = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    return match ? this.toPublicUser(match) : null;
  }

  async findUserRecordByEmail(email: string): Promise<StoredUserRecord | null> {
    const users = await this.read<StoredUserRecord[]>(LocalDataStore.USERS_KEY, []);
    const match = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    return match ?? null;
  }

  async getUser(uid: string): Promise<User | null> {
    const users = await this.read<StoredUserRecord[]>(LocalDataStore.USERS_KEY, []);
    const match = users.find(u => u.uid === uid);
    return match ? this.toPublicUser(match) : null;
  }

  async upsertUserFromIdentity(identity: {
    uid?: string;
    email: string;
    displayName?: string;
    photoURL?: string;
  }): Promise<User> {
    const users = await this.read<StoredUserRecord[]>(LocalDataStore.USERS_KEY, []);
    const normalizedEmail = identity.email.trim().toLowerCase();
    let record = users.find(u => u.email === normalizedEmail);
    const nowIso = new Date().toISOString();

    if (!record) {
      const baseSlug = this.slugFromDisplayName(identity.displayName || normalizedEmail);
      const slug = await this.ensureUniqueSlug(baseSlug);
      record = {
        uid: identity.uid || this.randomId('user'),
        email: normalizedEmail,
        displayName: identity.displayName || normalizedEmail,
        photoURL: identity.photoURL,
        slug,
        createdAt: nowIso,
        updatedAt: nowIso,
        password: this.randomId('pwd'),
      };
      users.push(record);
      await this.reserveSlug(slug, record.uid);
    } else {
      record.displayName = identity.displayName || record.displayName;
      record.photoURL = identity.photoURL || record.photoURL;
      record.updatedAt = nowIso;
    }

    await this.write(LocalDataStore.USERS_KEY, users);
    return this.toPublicUser(record);
  }

  async updateUserPassword(email: string, newPassword: string): Promise<User> {
    const users = await this.read<StoredUserRecord[]>(LocalDataStore.USERS_KEY, []);
    const index = users.findIndex(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (index === -1) {
      throw new Error('auth/user-not-found');
    }

    users[index].password = newPassword;
    users[index].updatedAt = new Date().toISOString();
    await this.write(LocalDataStore.USERS_KEY, users);
    return this.toPublicUser(users[index]);
  }

  async listUsers(): Promise<User[]> {
    const users = await this.read<StoredUserRecord[]>(LocalDataStore.USERS_KEY, []);
    return users.map(u => this.toPublicUser(u));
  }
  // #endregion

  private slugFromDisplayName(displayName: string): string {
    const base = displayName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 20);
    return base || `user-${Math.random().toString(36).substring(2, 8)}`;
  }

  // #region Profiles
  async getProfile(uid: string): Promise<Profile | null> {
    const profiles = await this.read<Profile[]>(LocalDataStore.PROFILES_KEY, []);
    return profiles.find(p => p.uid === uid) ?? null;
  }

  async upsertProfile(profile: Profile): Promise<void> {
    const profiles = await this.read<Profile[]>(LocalDataStore.PROFILES_KEY, []);
    const index = profiles.findIndex(p => p.uid === profile.uid);
    const updatedProfile = { ...profile, updatedAt: new Date().toISOString() as TimestampString };
    if (index === -1) {
      profiles.push(updatedProfile);
    } else {
      profiles[index] = updatedProfile;
    }
    await this.write(LocalDataStore.PROFILES_KEY, profiles);
  }
  // #endregion

  // #region Events
  async getEvents(): Promise<Event[]> {
    return this.read<Event[]>(LocalDataStore.EVENTS_KEY, []);
  }

  async getEvent(eventId: string): Promise<Event | null> {
    const events = await this.getEvents();
    return events.find(e => e.id === eventId) ?? null;
  }

  async getUpcomingEvents(): Promise<Event[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isoThreshold = today.toISOString().split('T')[0];
    const events = await this.getEvents();
    return events
      .filter(event => event.date >= isoThreshold)
      .sort((a, b) => (a.date === b.date ? a.title.localeCompare(b.title) : a.date.localeCompare(b.date)));
  }
  // #endregion

  // #region Routes
  async getRoutesByEvent(eventId: string): Promise<RouteDoc[]> {
    const routes = await this.read<RouteDoc[]>(LocalDataStore.ROUTES_KEY, []);
    return routes.filter(route => route.eventId === eventId && route.active !== false);
  }

  async getRoute(routeId: string): Promise<RouteDoc | null> {
    const routes = await this.read<RouteDoc[]>(LocalDataStore.ROUTES_KEY, []);
    return routes.find(route => route.id === routeId) ?? null;
  }
  // #endregion

  // #region Registrations
  async getRegistrations(eventId: string): Promise<EventRegistration[]> {
    const registrations = await this.read<EventRegistration[]>(LocalDataStore.REGISTRATIONS_KEY, []);
    return registrations.filter(reg => reg.eventId === eventId);
  }

  async getRegistration(eventId: string, uid: string): Promise<EventRegistration | null> {
    const registrations = await this.read<EventRegistration[]>(LocalDataStore.REGISTRATIONS_KEY, []);
    return (
      registrations.find(reg => reg.eventId === eventId && reg.uid === uid) ?? null
    );
  }

  async upsertRegistration(registration: EventRegistration): Promise<void> {
    const registrations = await this.read<EventRegistration[]>(LocalDataStore.REGISTRATIONS_KEY, []);
    const id = registration.id || `${registration.eventId}_${registration.uid}`;
    const nowIso = new Date().toISOString();
    const existingIndex = registrations.findIndex(reg => (reg.id || `${reg.eventId}_${reg.uid}`) === id);
    const updated: EventRegistration = {
      ...registration,
      id,
      updatedAt: nowIso,
      createdAt: registration.createdAt || nowIso,
    };

    if (existingIndex === -1) {
      registrations.push(updated);
    } else {
      registrations[existingIndex] = { ...registrations[existingIndex], ...updated };
    }

    await this.write(LocalDataStore.REGISTRATIONS_KEY, registrations);
  }

  async updateRegistrationStatus(eventId: string, uid: string, status: 'going' | 'maybe' | 'notgoing'): Promise<void> {
    const registrations = await this.read<EventRegistration[]>(LocalDataStore.REGISTRATIONS_KEY, []);
    const index = registrations.findIndex(reg => reg.eventId === eventId && reg.uid === uid);
    if (index === -1) {
      throw new Error('registration/not-found');
    }
    registrations[index] = {
      ...registrations[index],
      status,
      updatedAt: new Date().toISOString(),
    };
    await this.write(LocalDataStore.REGISTRATIONS_KEY, registrations);
  }

  async deleteRegistration(eventId: string, uid: string): Promise<void> {
    const registrations = await this.read<EventRegistration[]>(LocalDataStore.REGISTRATIONS_KEY, []);
    const filtered = registrations.filter(reg => !(reg.eventId === eventId && reg.uid === uid));
    await this.write(LocalDataStore.REGISTRATIONS_KEY, filtered);
  }

  async countParticipants(eventId: string, statuses: Array<'going' | 'maybe' | 'notgoing'> = ['going', 'maybe']): Promise<number> {
    const registrations = await this.read<EventRegistration[]>(LocalDataStore.REGISTRATIONS_KEY, []);
    return registrations.filter(reg => reg.eventId === eventId && statuses.includes(reg.status)).length;
  }
  // #endregion

  // #region Checkpoints & Progress
  async getCheckpoints(eventId: string, routeId?: string | null): Promise<Checkpoint[]> {
    const store = await this.read<Record<string, Checkpoint[]>>(LocalDataStore.CHECKPOINTS_KEY, {});
    let checkpoints = store[eventId] ?? [];
    if (routeId) {
      checkpoints = checkpoints.filter(cp => !cp.routeId || cp.routeId === routeId);
    }
    return checkpoints.slice().sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));
  }

  async setCheckpoints(eventId: string, checkpoints: Checkpoint[]): Promise<void> {
    const store = await this.read<Record<string, Checkpoint[]>>(LocalDataStore.CHECKPOINTS_KEY, {});
    store[eventId] = checkpoints;
    await this.write(LocalDataStore.CHECKPOINTS_KEY, store);
  }

  async recordGeofenceEvent(event: GeofenceEvent): Promise<void> {
    const logs = await this.read<Record<string, GeofenceEvent[]>>(LocalDataStore.CHECKPOINT_LOGS_KEY, {});
    const eventsForId = logs[event.eventId] ?? [];

    eventsForId.push({ ...event, id: event.id });
    logs[event.eventId] = eventsForId.slice(-200); // keep last 200 events per eventId
    await this.write(LocalDataStore.CHECKPOINT_LOGS_KEY, logs);

    const progressKey = `${event.eventId}_${event.userId}`;
    const progressStore = await this.read<Record<string, CheckpointProgress[]>>(LocalDataStore.CHECKPOINT_PROGRESS_KEY, {});
    const list = progressStore[progressKey] ?? [];
    const existingIndex = list.findIndex(item => item.checkpointId === event.checkpointId);

    if (event.eventType === 'ENTER') {
      const entry: CheckpointProgress = {
        id: `${event.eventId}_${event.userId}_${event.checkpointId}`,
        checkpointId: event.checkpointId,
        uid: event.userId,
        eventId: event.eventId,
        timestamp: event.timestamp as TimestampString,
        entryTimestamp: event.timestamp as TimestampString,
        latitude: event.latitude,
        longitude: event.longitude,
        entryLatitude: event.latitude,
        entryLongitude: event.longitude,
      };
      if (existingIndex === -1) {
        list.push(entry);
      } else {
        list[existingIndex] = { ...list[existingIndex], ...entry };
      }
    } else if (event.eventType === 'EXIT') {
      if (existingIndex === -1) {
        list.push({
          id: `${event.eventId}_${event.userId}_${event.checkpointId}`,
          checkpointId: event.checkpointId,
          uid: event.userId,
          eventId: event.eventId,
          timestamp: event.timestamp as TimestampString,
          latitude: event.latitude,
          longitude: event.longitude,
          exitTimestamp: event.timestamp as TimestampString,
          exitLatitude: event.latitude,
          exitLongitude: event.longitude,
        });
      } else {
        list[existingIndex] = {
          ...list[existingIndex],
          exitTimestamp: event.timestamp as TimestampString,
          exitLatitude: event.latitude,
          exitLongitude: event.longitude,
        };
      }
    }

    progressStore[progressKey] = list;
    await this.write(LocalDataStore.CHECKPOINT_PROGRESS_KEY, progressStore);
  }

  private randomId(prefix: string): string {
    return `${prefix}_${Math.random().toString(36).substring(2, 10)}`;
  }

  async getCheckpointEvents(eventId: string): Promise<GeofenceEvent[]> {
    const logs = await this.read<Record<string, GeofenceEvent[]>>(LocalDataStore.CHECKPOINT_LOGS_KEY, {});
    return logs[eventId] ?? [];
  }

  async getCheckpointProgress(eventId: string, uid: string): Promise<CheckpointProgress[]> {
    const store = await this.read<Record<string, CheckpointProgress[]>>(LocalDataStore.CHECKPOINT_PROGRESS_KEY, {});
    return store[`${eventId}_${uid}`] ?? [];
  }

  async clearCheckpointData(eventId: string): Promise<void> {
    const progressStore = await this.read<Record<string, CheckpointProgress[]>>(LocalDataStore.CHECKPOINT_PROGRESS_KEY, {});
    Object.keys(progressStore)
      .filter(key => key.startsWith(`${eventId}_`))
      .forEach(key => delete progressStore[key]);
    await this.write(LocalDataStore.CHECKPOINT_PROGRESS_KEY, progressStore);

    const logs = await this.read<Record<string, GeofenceEvent[]>>(LocalDataStore.CHECKPOINT_LOGS_KEY, {});
    delete logs[eventId];
    await this.write(LocalDataStore.CHECKPOINT_LOGS_KEY, logs);
  }
  // #endregion
}

interface StoredUserRecord extends User {
  password: string;
}

export const dataStore = new LocalDataStore();
