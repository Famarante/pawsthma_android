import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../stores/appStore';
import { useAuthStore } from '../../stores/authStore';
import { useHousehold } from '../../hooks/useHousehold';
import { G, SEV, SEV_BG, SEV_TEXT, SEV_BORDER, SHADOWS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import { fmtDuration, groupAttacksByDate } from '../../utils/data';
import { AppHeader } from '../../components/AppHeader';
import { WhoBadge } from '../../components/WhoBadge';
import { Attack } from '../../types';

export default function AttacksTab() {
  const { t } = useTranslation();
  const lang = useAuthStore((s) => s.lang);
  const uid = useAuthStore((s) => s.uid);
  const setModal = useAppStore((s) => s.setModal);
  const setAttackForm = useAppStore((s) => s.setAttackForm);
  const setEditAttackId = useAppStore((s) => s.setEditAttackId);
  const deleteAttack = useAppStore((s) => s.deleteAttack);
  const catId = useAppStore((s) => s.catId);
  const { homeKey, attacks, profiles } = useHousehold();

  const groups = groupAttacksByDate(attacks, lang);

  const handleEdit = (a: Attack) => {
    const totalSec = Math.max(0, Math.round(Number(a.duration || 0) * 60));
    setAttackForm({
      date: a.date || '',
      severity: (['mild', 'moderate', 'severe'] as const).includes(a.severity as any)
        ? (a.severity as 'mild' | 'moderate' | 'severe')
        : 'mild',
      durationMin: String(Math.floor(totalSec / 60)),
      durationSec: String(totalSec % 60),
      notes: a.notes || '',
    });
    setEditAttackId(a.id);
    setModal('editAttack');
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      t('del'),
      t('deleteAttackConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('confirm'),
          style: 'destructive',
          onPress: async () => {
            if (!homeKey || !catId) return;
            await deleteAttack(id, homeKey, catId, uid);
          },
        },
      ],
    );
  };

  const sevColor = (s: string) => SEV[s as keyof typeof SEV] || G.coral;

  return (
    <>
      <AppHeader />
      <View style={styles.bg}>
        <ScrollView contentContainerStyle={styles.content}>
          {/* Title */}
          <View style={styles.headerRow}>
            <Text style={styles.screenTitle}>{t('attackHistory')}</Text>
            <TouchableOpacity style={styles.filterBtn}>
              <MaterialIcons name="filter-list" size={20} color={G.sub} />
            </TouchableOpacity>
          </View>

          {/* Timeline */}
          {groups.map((group) => (
            <View key={group.dateKey}>
              {/* Date separator */}
              <View style={styles.dateRow}>
                <View style={styles.datePill}>
                  <Text style={styles.dateText}>{group.label}</Text>
                </View>
              </View>

              {group.items.map((a, idx) => (
                <View key={a.id} style={styles.timelineRow}>
                  {/* Timeline line + dot */}
                  <View style={styles.timelineLeft}>
                    <View style={[styles.timelineDot, { backgroundColor: sevColor(a.severity) }]} />
                    {idx < group.items.length - 1 && <View style={styles.timelineLine} />}
                  </View>

                  {/* Card */}
                  <TouchableOpacity
                    style={[styles.card, { borderLeftColor: sevColor(a.severity) }, SHADOWS.card]}
                    onPress={() => handleEdit(a)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.cardTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cardTitle}>
                          {a.notes ? a.notes.split(' ').slice(0, 3).join(' ') : t('attackLog')}
                        </Text>
                        <View style={styles.metaRow}>
                          <MaterialIcons name="schedule" size={13} color={G.muted} />
                          <Text style={styles.metaText}>{fmtDuration(a.duration, lang)}</Text>
                          <WhoBadge addedBy={a.addedBy} profiles={profiles} />
                        </View>
                      </View>
                      <View style={[styles.sevBadge, { backgroundColor: SEV_BG[a.severity] }]}>
                        <Text style={[styles.sevText, { color: SEV_TEXT[a.severity] || SEV[a.severity] }]}>
                          {t(`sevLabels.${a.severity}`)}
                        </Text>
                      </View>
                    </View>
                    {a.notes ? (
                      <View style={styles.notesBox}>
                        <Text style={styles.notesText} numberOfLines={2}>{a.notes}</Text>
                      </View>
                    ) : null}
                    <View style={styles.cardActions}>
                      <TouchableOpacity style={styles.editBtn} onPress={() => handleEdit(a)}>
                        <MaterialIcons name="edit" size={14} color={G.sub} />
                        <Text style={styles.editText}>{t('edit')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(a.id)}>
                        <MaterialIcons name="delete-outline" size={14} color={G.coral} />
                        <Text style={styles.deleteText}>{t('del')}</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ))}

          {!attacks.length && (
            <View style={styles.empty}>
              <MaterialIcons name="favorite-border" size={48} color={G.dim} />
              <Text style={styles.emptyText}>No attacks recorded yet</Text>
            </View>
          )}
        </ScrollView>

      </View>
    </>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: G.bg },
  content: { padding: 16, paddingBottom: 24 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  screenTitle: {
    color: G.text,
    fontSize: 22,
    fontFamily: FONTS.extraBold,
  },
  filterBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: G.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Date separator
  dateRow: { marginBottom: 12, marginTop: 4 },
  datePill: {
    backgroundColor: G.surface,
    alignSelf: 'flex-start',
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  dateText: { color: G.sub, fontSize: 12, fontFamily: FONTS.semiBold },

  // Timeline
  timelineRow: { flexDirection: 'row', marginBottom: 12 },
  timelineLeft: { width: 24, alignItems: 'center', paddingTop: 18 },
  timelineDot: { width: 10, height: 10, borderRadius: 5, zIndex: 1 },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: 'rgba(226,232,240,0.6)',
    marginTop: 2,
  },

  // Card
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 4,
    borderRadius: 16,
    padding: 16,
    marginLeft: 8,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { color: G.text, fontFamily: FONTS.bold, fontSize: 15, marginBottom: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  metaText: { color: G.muted, fontSize: 12, fontFamily: FONTS.regular },
  sevBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20 },
  sevText: { fontSize: 11, fontFamily: FONTS.bold },
  notesBox: {
    backgroundColor: G.surface,
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  notesText: { color: G.sub, fontSize: 13, fontFamily: FONTS.regular, lineHeight: 18 },
  cardActions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: G.surface,
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  editText: { color: G.sub, fontSize: 11, fontFamily: FONTS.semiBold },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,107,107,0.06)',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  deleteText: { color: G.coral, fontSize: 11, fontFamily: FONTS.semiBold },

  // Empty
  empty: { alignItems: 'center', paddingTop: 60, paddingBottom: 40, gap: 12 },
  emptyText: { color: G.sub, fontSize: 15, fontFamily: FONTS.medium },

});
