import { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Modal from 'react-native-modal';
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

const fmtTime = (dateStr: string): string | null => {
  if (!dateStr.includes('T')) return null;
  const timePart = dateStr.split('T')[1];
  if (!timePart) return null;
  const [h, m] = timePart.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
};

type SevFilter = 'all' | 'mild' | 'moderate' | 'severe';

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

  const [filterSev, setFilterSev] = useState<SevFilter>('all');
  const [showFilter, setShowFilter] = useState(false);

  const filteredAttacks = filterSev === 'all' ? attacks : attacks.filter((a) => a.severity === filterSev);
  const groups = groupAttacksByDate(filteredAttacks, lang);

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
      triggers: a.triggers || [],
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
            <TouchableOpacity
              style={[styles.filterBtn, filterSev !== 'all' && styles.filterBtnActive]}
              onPress={() => setShowFilter(true)}
            >
              <MaterialIcons name="filter-list" size={20} color={filterSev !== 'all' ? G.primary : G.sub} />
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
                          {fmtTime(a.date) && (
                            <View style={styles.timePill}>
                              <MaterialIcons name="access-time" size={11} color={G.sub} />
                              <Text style={styles.timePillText}>{fmtTime(a.date)}</Text>
                            </View>
                          )}
                          <WhoBadge addedBy={a.addedBy} profiles={profiles} />
                        </View>
                        {a.triggers && a.triggers.length > 0 && (
                          <View style={styles.triggerRow}>
                            {a.triggers.map((tr) => (
                              <View key={tr} style={styles.triggerChip}>
                                <Text style={styles.triggerChipText}>{t(`triggerLabels.${tr}`)}</Text>
                              </View>
                            ))}
                          </View>
                        )}
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

          {!filteredAttacks.length && (
            <View style={styles.empty}>
              <MaterialIcons name="favorite-border" size={48} color={G.dim} />
              <Text style={styles.emptyText}>{filterSev !== 'all' ? t('noAttacksFilter') : t('noAttacksYet')}</Text>
            </View>
          )}
        </ScrollView>

        {/* Filter modal */}
        <Modal
          isVisible={showFilter}
          onBackdropPress={() => setShowFilter(false)}
          style={{ justifyContent: 'flex-end', margin: 0 }}
          backdropOpacity={0.35}
        >
          <View style={styles.filterSheet}>
            <View style={styles.filterHandle} />
            <Text style={styles.filterTitle}>{t('filterBySeverity')}</Text>
            {(['all', 'mild', 'moderate', 'severe'] as SevFilter[]).map((sev) => (
              <TouchableOpacity
                key={sev}
                style={[styles.filterOption, filterSev === sev && styles.filterOptionActive]}
                onPress={() => { setFilterSev(sev); setShowFilter(false); }}
              >
                {sev !== 'all' && (
                  <View style={[styles.filterDot, { backgroundColor: SEV[sev] }]} />
                )}
                <Text style={[styles.filterOptionText, filterSev === sev && { color: G.primary, fontFamily: FONTS.bold }]}>
                  {sev === 'all' ? t('allSeverities') : t(`sevLabels.${sev}`)}
                </Text>
                {filterSev === sev && <MaterialIcons name="check" size={18} color={G.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </Modal>
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

  // Filter button active state
  filterBtnActive: { backgroundColor: 'rgba(255,126,103,0.12)' },

  // Time pill
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: G.surface,
    borderRadius: 8,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  timePillText: { color: G.sub, fontSize: 11, fontFamily: FONTS.semiBold },

  // Trigger chips on card
  triggerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 },
  triggerChip: {
    backgroundColor: 'rgba(139,92,246,0.08)',
    borderRadius: 8,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  triggerChipText: { color: G.indigo, fontSize: 11, fontFamily: FONTS.semiBold },

  // Filter sheet
  filterSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 40,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  filterHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: G.dim,
    alignSelf: 'center',
    marginBottom: 20,
  },
  filterTitle: {
    color: G.text,
    fontSize: 17,
    fontFamily: FONTS.bold,
    marginBottom: 16,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  filterOptionActive: { backgroundColor: 'rgba(255,126,103,0.04)', borderRadius: 12, paddingHorizontal: 8 },
  filterDot: { width: 10, height: 10, borderRadius: 5 },
  filterOptionText: { flex: 1, color: G.text, fontSize: 15, fontFamily: FONTS.medium },
});
