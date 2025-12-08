import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Mock data for libraries (until Prisma client is fixed)
const mockLibraries = [
  {
    id: 'lib-1',
    userId: 'user-1',
    name: 'My Library',
    description: 'All my research references',
    color: '#6366f1',
    isShared: false,
    isPublic: false,
    settings: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    _count: { references: 15, members: 1 }
  },
  {
    id: 'lib-2',
    userId: 'user-1',
    name: 'PhD Thesis',
    description: 'References for my dissertation research',
    color: '#10b981',
    isShared: false,
    isPublic: false,
    settings: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    _count: { references: 89, members: 1 }
  },
  {
    id: 'lib-3',
    userId: 'user-1',
    name: 'Team Research Project',
    description: 'Shared references with lab colleagues',
    color: '#f59e0b',
    isShared: true,
    isPublic: false,
    settings: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    _count: { references: 156, members: 5 }
  }
];

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return mock libraries for now
    const userLibraries = mockLibraries.filter(lib => lib.userId === user.id);

    return NextResponse.json({ libraries: userLibraries });
  } catch (error) {
    console.error('Error fetching libraries:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, description, color, isShared } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Library name is required' }, { status: 400 });
    }

    // Create mock library
    const newLibrary = {
      id: `lib-${Date.now()}`,
      userId: user.id,
      name,
      description: description || '',
      color: color || '#6366f1',
      isShared: isShared || false,
      isPublic: false,
      settings: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      _count: { references: 0, members: 1 }
    };

    // Add to mock data
    mockLibraries.push(newLibrary);

    return NextResponse.json({ library: newLibrary }, { status: 201 });
  } catch (error) {
    console.error('Error creating library:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}